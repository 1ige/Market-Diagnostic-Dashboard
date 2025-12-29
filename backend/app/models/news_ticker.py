from sqlalchemy import Column, Integer, String, UniqueConstraint

from app.core.db import Base


# Editable ticker list used to decide which symbols get cached.
class NewsTicker(Base):
    __tablename__ = "news_ticker"
    __table_args__ = (UniqueConstraint("symbol", "sector", name="uq_news_ticker_symbol_sector"),)

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    sector = Column(String, index=True)
