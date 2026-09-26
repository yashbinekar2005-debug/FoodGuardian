import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.product import GUID


class Jurisdiction(Base):
    __tablename__ = "jurisdictions"

    id = Column(String(10), primary_key=True)  # 'IN', 'EU'
    name = Column(String(100), nullable=False)
    authority_name = Column(String(255), nullable=False)
    country_code = Column(String(10), nullable=True)

    rules = relationship("RegulatoryRule", back_populates="jurisdiction")
    sources = relationship("Source", back_populates="jurisdiction")


class Source(Base):
    __tablename__ = "sources"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    jurisdiction_id = Column(String(10), ForeignKey("jurisdictions.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    short_title = Column(String(100), nullable=False)
    url = Column(Text, nullable=False)
    document_type = Column(String(50), nullable=False)  # regulation, compendium, database, amendment
    effective_version = Column(String(50), nullable=True)
    last_checked_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    jurisdiction = relationship("Jurisdiction", back_populates="sources")
    rules = relationship("RegulatoryRule", back_populates="source")


class RegulatoryRule(Base):
    __tablename__ = "regulatory_rules"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    jurisdiction_id = Column(String(10), ForeignKey("jurisdictions.id", ondelete="CASCADE"), nullable=False, index=True)
    regulation_name = Column(String(255), nullable=False)
    regulation_number = Column(String(100), nullable=False)
    version = Column(String(50), default="2026-08", nullable=False, index=True)
    effective_from = Column(DateTime, nullable=True)
    effective_to = Column(DateTime, nullable=True)
    subject_type = Column(String(50), default="additive", nullable=False)  # additive, ingredient, contaminant, labelling
    substance_id = Column(String(100), nullable=False, index=True)  # E330, E110, etc.
    food_category = Column(String(100), default="all", nullable=False, index=True)  # all, biscuits, sauces, beverages, etc.
    authorization_status = Column(String(50), nullable=False, index=True)  # authorized, not_authorized, condition_applies, limit_applies, unknown
    maximum_level = Column(String(100), nullable=True)
    maximum_level_unit = Column(String(50), nullable=True)
    conditions_of_use = Column(Text, nullable=True)
    labelling_requirement = Column(Text, nullable=True)
    exceptions = Column(Text, nullable=True)
    source_id = Column(GUID(), ForeignKey("sources.id", ondelete="SET NULL"), nullable=True)
    source_url = Column(Text, nullable=True)
    source_document = Column(Text, nullable=True)
    source_last_checked = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    jurisdiction = relationship("Jurisdiction", back_populates="rules")
    source = relationship("Source", back_populates="rules")

    __table_args__ = (
        Index("ix_reg_rule_lookup", "jurisdiction_id", "substance_id", "food_category"),
    )


class RuleVersion(Base):
    __tablename__ = "rule_versions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    version_code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    published_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
