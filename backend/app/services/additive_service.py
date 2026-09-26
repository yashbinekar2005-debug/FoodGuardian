from typing import Optional, List, Dict, Any
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.additive import Additive, AdditiveAlias


class AdditiveService:
    @staticmethod
    async def get_by_code(session: AsyncSession, code: str) -> Optional[Additive]:
        clean_code = code.strip().upper()
        if not clean_code.startswith("E") and clean_code.isdigit():
            clean_code = f"E{clean_code}"
        
        ins_candidate = clean_code.replace("E", "") if clean_code.startswith("E") else clean_code

        stmt = select(Additive).where(
            or_(
                func.upper(Additive.code) == clean_code,
                Additive.ins_code == ins_candidate,
                Additive.ins_code == clean_code
            )
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def match_token(session: AsyncSession, parsed_token: Dict[str, Any]) -> Optional[Additive]:
        """
        Attempts to resolve an ingredient token to a canonical Additive.
        Prioritizes detected INS/E-number code, then falls back to alias matching.
        """
        # 1. By code
        detected_code = parsed_token.get("detected_code")
        if detected_code:
            add = await AdditiveService.get_by_code(session, detected_code)
            if add:
                return add

        clean_name = parsed_token.get("clean_name", "").lower().strip()
        if not clean_name:
            return None

        # 2. Direct exact name match
        stmt = select(Additive).where(func.lower(Additive.name) == clean_name)
        result = await session.execute(stmt)
        add = result.scalar_one_or_none()
        if add:
            return add

        # 3. Alias match
        alias_stmt = (
            select(Additive)
            .join(AdditiveAlias, Additive.id == AdditiveAlias.additive_id)
            .where(func.lower(AdditiveAlias.alias) == clean_name)
        )
        alias_res = await session.execute(alias_stmt)
        add = alias_res.scalar_one_or_none()
        if add:
            return add

        # 4. Substring / partial alias match for compound names
        for word in clean_name.split():
            if len(word) >= 4:
                sub_stmt = (
                    select(Additive)
                    .join(AdditiveAlias, Additive.id == AdditiveAlias.additive_id)
                    .where(AdditiveAlias.alias == word)
                )
                sub_res = await session.execute(sub_stmt)
                sub_add = sub_res.scalar_one_or_none()
                if sub_add:
                    return sub_add

        return None
