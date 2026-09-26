import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.product import GUID


class NutritionFact(Base):
    __tablename__ = "nutrition_facts"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    product_id = Column(GUID(), ForeignKey("products.id", ondelete="CASCADE"), nullable=True, index=True)
    basis = Column(String(50), default="per_100g", nullable=False)  # per_100g, per_100ml, per_serving
    energy_kcal = Column(Float, nullable=True)
    fat_g = Column(Float, nullable=True)
    saturated_fat_g = Column(Float, nullable=True)
    carbohydrates_g = Column(Float, nullable=True)
    sugars_g = Column(Float, nullable=True)
    fiber_g = Column(Float, nullable=True)
    protein_g = Column(Float, nullable=True)
    sodium_mg = Column(Float, nullable=True)
    salt_g = Column(Float, nullable=True)
    raw_data = Column(Text, nullable=True)  # JSON-encoded raw extracted nutrition
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    product = relationship("Product", back_populates="nutrition_facts")
