import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index, Table
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.product import GUID

# Association table for ingredient <-> additive
ingredient_additive_links = Table(
    "ingredient_additive_links",
    Base.metadata,
    Column("ingredient_id", GUID(), ForeignKey("ingredients.id", ondelete="CASCADE"), primary_key=True),
    Column("additive_id", GUID(), ForeignKey("additives.id", ondelete="CASCADE"), primary_key=True)
)


class Additive(Base):
    __tablename__ = "additives"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), nullable=False, unique=True, index=True)  # E330
    ins_code = Column(String(50), nullable=True, index=True)           # 330
    name = Column(String(255), nullable=False, index=True)             # Citric acid
    functional_classes = Column(Text, nullable=False)                  # JSON list or comma-separated: 'acidity_regulator,antioxidant'
    description = Column(Text, nullable=True)
    source_reference = Column(String(255), nullable=True)              # e.g., 'Regulation (EC) No 1333/2008 & FSSAI'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    aliases = relationship("AdditiveAlias", back_populates="additive", cascade="all, delete-orphan")


class AdditiveAlias(Base):
    __tablename__ = "additive_aliases"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    additive_id = Column(GUID(), ForeignKey("additives.id", ondelete="CASCADE"), nullable=False, index=True)
    alias = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    additive = relationship("Additive", back_populates="aliases")

    __table_args__ = (
        Index("ix_additive_alias_lower", "alias"),
    )
