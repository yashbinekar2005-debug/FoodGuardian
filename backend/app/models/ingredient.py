import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.product import GUID


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    canonical_name = Column(String(255), nullable=False, unique=True, index=True)
    category = Column(String(100), nullable=True, index=True)  # e.g., grain, dairy, preservative, etc.
    description = Column(Text, nullable=True)
    is_additive = Column(Boolean, default=False, nullable=False)
    additive_code = Column(String(50), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    aliases = relationship("IngredientAlias", back_populates="ingredient", cascade="all, delete-orphan")


class IngredientAlias(Base):
    __tablename__ = "ingredient_aliases"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    ingredient_id = Column(GUID(), ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False, index=True)
    alias = Column(String(255), nullable=False, index=True)
    language = Column(String(10), default="en", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ingredient = relationship("Ingredient", back_populates="aliases")

    __table_args__ = (
        Index("ix_ingredient_alias_lower", "alias"),
    )
