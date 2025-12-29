from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String

from app.core.db import Base


# Cached news entries from external sources (e.g., Seeking Alpha RSS).
class NewsArticle(Base):
    __tablename__ = "news_article"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    sector = Column(String, index=True, nullable=True)
    source = Column(String)
    title = Column(String)
    link = Column(String)
    guid = Column(String, unique=True, index=True)
    published_at = Column(DateTime, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
