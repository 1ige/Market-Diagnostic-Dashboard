"""
Market News API Endpoints
"""
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.news_article import NewsArticle
from app.services.news_service import (
    ensure_default_tickers,
    list_news_tickers,
    replace_news_tickers,
    refresh_news_cache,
)
from app.utils.db_helpers import get_db_session
from app.utils.response_helpers import format_news_article, format_news_ticker

router = APIRouter()


class NewsTickerItem(BaseModel):
    symbol: str = Field(..., min_length=1)
    sector: Optional[str] = "GENERAL"


class NewsTickerList(BaseModel):
    tickers: List[NewsTickerItem]


@router.get("/news/tickers")
def get_news_tickers():
    """Return the cached list of tickers used for news aggregation."""
    with get_db_session() as db:
        # Seed the cache on first access so the UI can edit immediately.
        ensure_default_tickers(db)
        tickers = list_news_tickers(db)
        return {
            "count": len(tickers),
            "tickers": [format_news_ticker(ticker) for ticker in tickers],
        }


@router.put("/news/tickers")
def update_news_tickers(payload: NewsTickerList):
    """Replace the cached list of tickers for news aggregation."""
    with get_db_session() as db:
        tickers = replace_news_tickers(
            db, [ticker.model_dump() for ticker in payload.tickers]
        )
        return {
            "count": len(tickers),
            "tickers": [format_news_ticker(ticker) for ticker in tickers],
        }


@router.post("/news/refresh")
def refresh_news(symbol: Optional[str] = None, sector: Optional[str] = None):
    """Fetch latest news and update the cache."""
    with get_db_session() as db:
        result = refresh_news_cache(db, symbol=symbol, sector=sector)
        return result


@router.get("/news")
def list_news(
    hours: int = 168,
    limit: int = 200,
    symbol: Optional[str] = None,
    sector: Optional[str] = None,
):
    """Return cached news articles."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    with get_db_session() as db:
        query = db.query(NewsArticle).filter(NewsArticle.published_at >= cutoff)

        if symbol:
            query = query.filter(NewsArticle.symbol == symbol.strip().upper())
        if sector:
            query = query.filter(NewsArticle.sector == sector.strip())

        articles = (
            query.order_by(NewsArticle.published_at.desc())
            .limit(limit)
            .all()
        )
        return [format_news_article(article) for article in articles]
