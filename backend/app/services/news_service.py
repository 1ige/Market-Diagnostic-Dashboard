import calendar
import logging
import time
from datetime import datetime, timezone
from typing import Dict, Iterable, List, Optional

import feedparser
import requests
from dateutil import parser as dateparser

from app.models.news_article import NewsArticle
from app.models.news_ticker import NewsTicker

logger = logging.getLogger(__name__)

NEWS_SOURCE = "SeekingAlpha"
REQUEST_PAUSE = 0.6
MAX_ITEMS_PER_TICKER = 10

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; MarketDashboardNews/1.0; +https://example.local/)"
}

# Seed list for the ticker cache when no rows exist yet.
DEFAULT_TICKERS: Dict[str, List[str]] = {
    "ACTIVE_INVESTMENT": [
        "AAPL", "ABAT", "APH", "DVLT", "FIG", "GD", "GE", "GEV", "GME", "GOOGL", "GPRO",
        "GPUS", "INTU", "IONQ", "LAC", "LMT", "MA", "MP", "MSFT", "NVTS", "OPEN", "QBTS",
        "RGTI", "RKT", "RMBS", "RTX", "SNOW", "TJX", "TXN", "V", "VIXW", "VZ", "WULF"
    ],
    "LONG_HOLDS": [
        "VOO", "VXUS", "BNDX", "EMB", "HYG", "HYXU", "ISHG", "AFK", "EWH", "INDA", "KSA",
        "VGK", "VWO", "ASST", "NOW", "BOTZ", "BRKB", "BYND", "ETHA", "FAZ", "FIGFX",
        "FIVLX", "FSDAX", "GLW", "HACK", "IBIT", "IMSR", "LAES", "MADE", "MU", "NRGV",
        "NVDA", "NVNI", "NXXT", "OCGN", "PLB50", "PYPL", "RKLB", "RR", "SB1000", "T",
        "TCEHY", "TSM", "UMAC", "UUUU", "VDC", "VWELX", "XLV"
    ]
}


def normalize_symbol(symbol: str) -> str:
    return symbol.strip().upper()


def ensure_default_tickers(db) -> None:
    # Only seed once to preserve user edits.
    if db.query(NewsTicker).count() > 0:
        return

    for sector, symbols in DEFAULT_TICKERS.items():
        for symbol in symbols:
            db.add(NewsTicker(symbol=normalize_symbol(symbol), sector=sector))
    db.commit()


def list_news_tickers(db) -> List[NewsTicker]:
    return (
        db.query(NewsTicker)
        .order_by(NewsTicker.sector.asc(), NewsTicker.symbol.asc())
        .all()
    )


def replace_news_tickers(db, tickers: Iterable[Dict[str, str]]) -> List[NewsTicker]:
    db.query(NewsTicker).delete()

    seen = set()
    for ticker in tickers:
        raw_symbol = (ticker.get("symbol") or "").strip()
        if not raw_symbol:
            continue
        sector = (ticker.get("sector") or "GENERAL").strip() or "GENERAL"
        symbol = normalize_symbol(raw_symbol)
        key = (symbol, sector)
        if key in seen:
            continue
        seen.add(key)
        db.add(NewsTicker(symbol=symbol, sector=sector))

    db.commit()
    return list_news_tickers(db)


def _parse_entry_datetime(entry: dict) -> datetime:
    published = entry.get("published") or entry.get("updated")
    if published:
        try:
            parsed = dateparser.parse(published)
            if parsed and parsed.tzinfo:
                parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
            if parsed:
                return parsed
        except Exception:
            pass

    parsed_struct = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed_struct:
        try:
            timestamp = calendar.timegm(parsed_struct)
            return datetime.fromtimestamp(timestamp, tz=timezone.utc).replace(tzinfo=None)
        except Exception:
            pass

    return datetime.utcnow()


def fetch_news_for_symbol(symbol: str, max_items: int = MAX_ITEMS_PER_TICKER) -> List[Dict[str, object]]:
    rss_url = f"https://seekingalpha.com/api/sa/combined/{requests.utils.quote(symbol)}.xml"
    try:
        response = requests.get(rss_url, headers=HEADERS, timeout=15)
        response.raise_for_status()
    except Exception as exc:
        logger.warning("News fetch failed for %s: %s", symbol, exc)
        return []

    feed = feedparser.parse(response.content)
    entries: List[Dict[str, object]] = []
    for entry in feed.get("entries", [])[:max_items]:
        title = (entry.get("title") or "").strip()
        link = (entry.get("link") or "").strip()
        if not title or not link:
            continue
        guid = str(entry.get("id") or entry.get("guid") or link)
        entries.append({
            "title": title,
            "link": link,
            "guid": guid,
            "published_at": _parse_entry_datetime(entry),
        })

    time.sleep(REQUEST_PAUSE)
    return entries


def cache_news_entries(
    db,
    symbol: str,
    sector: Optional[str],
    entries: List[Dict[str, object]]
) -> int:
    # Deduplicate by GUID so refreshes do not create duplicates.
    if not entries:
        return 0

    guids = [entry["guid"] for entry in entries if entry.get("guid")]
    existing_guids = set()
    if guids:
        existing_guids = {
            row[0]
            for row in db.query(NewsArticle.guid)
            .filter(NewsArticle.guid.in_(guids))
            .all()
        }

    new_count = 0
    for entry in entries:
        guid = entry.get("guid")
        if not guid or guid in existing_guids:
            continue
        article = NewsArticle(
            symbol=normalize_symbol(symbol),
            sector=sector,
            source=NEWS_SOURCE,
            title=entry.get("title") or "",
            link=entry.get("link") or "",
            guid=str(guid),
            published_at=entry.get("published_at") or datetime.utcnow(),
        )
        db.add(article)
        new_count += 1

    if new_count:
        db.commit()
    return new_count


def refresh_news_cache(
    db,
    symbol: Optional[str] = None,
    sector: Optional[str] = None,
    max_items_per_ticker: int = MAX_ITEMS_PER_TICKER
) -> Dict[str, int]:
    # Fetch and cache the latest items for the selected tickers.
    ensure_default_tickers(db)
    tickers = list_news_tickers(db)

    if symbol:
        normalized = normalize_symbol(symbol)
        tickers = [ticker for ticker in tickers if ticker.symbol == normalized]

    if sector:
        filtered_sector = sector.strip()
        tickers = [ticker for ticker in tickers if ticker.sector == filtered_sector]

    new_items = 0
    for ticker in tickers:
        try:
            entries = fetch_news_for_symbol(ticker.symbol, max_items=max_items_per_ticker)
            new_items += cache_news_entries(db, ticker.symbol, ticker.sector, entries)
        except Exception as exc:
            logger.warning("Failed caching news for %s: %s", ticker.symbol, exc)

    return {
        "tickers_checked": len(tickers),
        "new_items": new_items,
    }
