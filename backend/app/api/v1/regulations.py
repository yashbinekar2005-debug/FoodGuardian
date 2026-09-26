from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.models.regulatory import RegulatoryRule
from app.schemas.regulatory import RegulationQueryResponse, RegulatoryRuleDetail

router = APIRouter(prefix="/regulations", tags=["Regulations"])


@router.get(
    "",
    response_model=RegulationQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Query Regulatory Rules",
    description="Returns applicable regulatory rules filtered by jurisdiction (IN or EU), subject, substance/additive code, and food category."
)
async def get_regulations(
    jurisdiction: str = Query(..., description="Jurisdiction code e.g. 'IN' or 'EU'"),
    subject: str = Query("additive", description="Subject type e.g. 'additive', 'contaminant', 'labelling'"),
    code: Optional[str] = Query(None, description="Additive code e.g. 'E330'"),
    category: Optional[str] = Query(None, description="Food category e.g. 'biscuits', 'sauce', 'all'"),
    db: AsyncSession = Depends(get_db)
) -> RegulationQueryResponse:
    jur_upper = jurisdiction.strip().upper()
    query = select(RegulatoryRule).where(
        and_(
            RegulatoryRule.jurisdiction_id == jur_upper,
            RegulatoryRule.subject_type == subject.lower()
        )
    )

    if code:
        clean_code = code.strip().upper()
        if not clean_code.startswith("E") and clean_code.isdigit():
            clean_code = f"E{clean_code}"
        query = query.where(RegulatoryRule.substance_id == clean_code)

    if category:
        query = query.where(RegulatoryRule.food_category == category.lower().strip())

    result = await db.execute(query)
    rules = result.scalars().all()

    rule_details = [
        RegulatoryRuleDetail(
            status=r.authorization_status,
            food_category=r.food_category,
            conditions=r.conditions_of_use,
            maximum_level=r.maximum_level,
            maximum_level_unit=r.maximum_level_unit,
            labelling_requirement=r.labelling_requirement,
            regulation=r.regulation_name,
            regulation_number=r.regulation_number,
            version=r.version,
            source_url=r.source_url,
            source_document=r.source_document
        )
        for r in rules
    ]

    return RegulationQueryResponse(
        jurisdiction=jur_upper,
        subject=subject,
        code=code,
        rules=rule_details
    )
