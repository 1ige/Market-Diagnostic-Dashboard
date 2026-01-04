from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.core.db import Base
from datetime import datetime

class SectorProjectionRun(Base):
    __tablename__ = "sector_projection_run"
    id = Column(Integer, primary_key=True, autoincrement=True)
    as_of_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    system_state = Column(String, nullable=False)
    model_version = Column(String, nullable=False)
    config_json = Column(JSON, nullable=True)
    values = relationship("SectorProjectionValue", back_populates="run", cascade="all, delete-orphan")

class SectorProjectionValue(Base):
    __tablename__ = "sector_projection_value"
    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(Integer, ForeignKey("sector_projection_run.id"), nullable=False, index=True)
    horizon = Column(String, nullable=False)  # "3m", "6m", "12m"
    sector_symbol = Column(String, nullable=False)
    sector_name = Column(String, nullable=False)
    score_total = Column(Float, nullable=False)
    score_trend = Column(Float, nullable=False)
    score_rel = Column(Float, nullable=False)
    score_risk = Column(Float, nullable=False)
    score_regime = Column(Float, nullable=False)
    metrics_json = Column(JSON, nullable=False)
    rank = Column(Integer, nullable=False)
    run = relationship("SectorProjectionRun", back_populates="values")
