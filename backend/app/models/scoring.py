import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.product import GUID


class ScoringMethodology(Base):
    __tablename__ = "scoring_methodologies"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    version = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    weights = Column(Text, nullable=False)     # JSON: {"nutrition": 0.40, "additives": 0.20, ...}
    thresholds = Column(Text, nullable=False)  # JSON: {"A": [90, 100], "B": [80, 89], ...}
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    product_hash = Column(String(64), nullable=False, index=True)
    product_id = Column(GUID(), ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    grade = Column(String(5), nullable=False)  # 'A', 'B', 'C', 'D', 'E', 'F'
    score = Column(Float, nullable=False)      # 0 - 100
    confidence = Column(Float, nullable=False) # 0.0 - 1.0
    scoring_version = Column(String(50), default="1.0", nullable=False)
    regulatory_version = Column(String(50), default="2026-08", nullable=False)
    result_payload = Column(Text, nullable=False)  # Full JSON result snapshot
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    product = relationship("Product", back_populates="analysis_results")
    factors = relationship("AnalysisFactor", back_populates="analysis", cascade="all, delete-orphan")


class AnalysisFactor(Base):
    __tablename__ = "analysis_factors"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(GUID(), ForeignKey("analysis_results.id", ondelete="CASCADE"), nullable=False, index=True)
    factor_id = Column(String(100), nullable=False)
    factor_name = Column(String(255), nullable=False)
    impact = Column(String(20), nullable=False)  # positive, negative, neutral
    weight = Column(Float, nullable=False)
    score_delta = Column(Float, default=0.0, nullable=False)
    reason = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)  # JSON or text

    analysis = relationship("AnalysisResult", back_populates="factors")
