import re
from typing import List, Dict, Any, Optional, Tuple


class IngredientNormalizer:
    """
    Robust tokenizer and normalizer for packaged-food ingredient lists.
    Handles nested parentheses, semicolons, percentages, numbering, and functional prefixes.
    """

    # Additive pattern matchers
    INS_PATTERN = re.compile(r'\b(?:INS|E)[-\s]?([0-9]{3,4}[a-z]?)\b', re.IGNORECASE)
    STANDALONE_CODE_PATTERN = re.compile(r'\b([0-9]{3,4}[a-z]?)\b', re.IGNORECASE)
    PERCENT_PATTERN = re.compile(r'(\d+(?:\.\d+)?\s*%)')

    FUNCTIONAL_CLASSES = [
        "acidity regulator", "preservative", "emulsifier", "stabilizer",
        "stabiliser", "color", "colour", "flavor", "flavour", "antioxidant",
        "sweetener", "raising agent", "anticaking agent", "anti-caking agent",
        "thickener", "flavour enhancer", "flavor enhancer", "glazing agent",
        "humectant", "firming agent", "foaming agent", "gelling agent"
    ]

    def clean_text(self, text: str) -> str:
        """Removes prefix headers like 'Ingredients:' and excessive punctuation."""
        if not text:
            return ""
        # Strip common leading labels
        text = re.sub(r'^(?:ingredients|ingredients\s*:|composition\s*:)', '', text.strip(), flags=re.IGNORECASE)
        # Normalize double spaces and unusual dashes
        text = text.replace('\n', ' ').replace('\r', ' ')
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def split_tokens(self, text: str) -> List[str]:
        """
        Splits ingredient text by commas or semicolons, but keeps parentheses intact.
        Example: 'Wheat flour, Palm oil, Acidity Regulator (INS 330, INS 500(ii))'
        -> ['Wheat flour', 'Palm oil', 'Acidity Regulator (INS 330, INS 500(ii))']
        """
        cleaned = self.clean_text(text)
        if not cleaned:
            return []

        tokens: List[str] = []
        current: List[str] = []
        depth = 0

        for char in cleaned:
            if char == '(' or char == '[':
                depth += 1
                current.append(char)
            elif char == ')' or char == ']':
                depth = max(0, depth - 1)
                current.append(char)
            elif (char == ',' or char == ';') and depth == 0:
                token = "".join(current).strip()
                if token:
                    tokens.append(token)
                current = []
            else:
                current.append(char)

        if current:
            token = "".join(current).strip()
            if token:
                tokens.append(token)

        return tokens

    def parse_token(self, token: str) -> Dict[str, Any]:
        """
        Parses an individual ingredient token into structured fields:
        raw_text, cleaned_name, detected_code, detected_function, percentage.
        """
        raw = token.strip()
        # Remove trailing period if present
        if raw.endswith('.'):
            raw = raw[:-1].strip()

        # Extract percentage if present
        percentage: Optional[str] = None
        pct_match = self.PERCENT_PATTERN.search(raw)
        if pct_match:
            percentage = pct_match.group(0)

        # Check functional class prefix
        detected_function: Optional[str] = None
        lower_token = raw.lower()
        for fc in self.FUNCTIONAL_CLASSES:
            if fc in lower_token:
                detected_function = fc.replace(' ', '_').replace('stabiliser', 'stabilizer').replace('flavour', 'flavor').replace('colour', 'color')
                break

        # Check for INS/E code inside or outside parentheses
        detected_code: Optional[str] = None
        ins_match = self.INS_PATTERN.search(raw)
        if ins_match:
            code_num = ins_match.group(1).upper()
            detected_code = f"E{code_num}" if not code_num.startswith('E') else code_num
        elif detected_function:
            # Look for number in parentheses after a functional class
            num_match = re.search(r'\(\s*(?:ins\s*)?([0-9]{3,4}[a-z]?)\s*\)', raw, re.IGNORECASE)
            if num_match:
                detected_code = f"E{num_match.group(1).upper()}"

        # Clean name: remove percentages and extra brackets for lookup
        clean_name = self.PERCENT_PATTERN.sub('', raw)
        clean_name = re.sub(r'[\(\)\[\]]', ' ', clean_name)
        clean_name = re.sub(r'\s+', ' ', clean_name).strip()

        return {
            "raw_text": token.strip(),
            "clean_name": clean_name.lower(),
            "detected_code": detected_code,
            "detected_function": detected_function or "ingredient",
            "percentage": percentage
        }

    def tokenize_and_normalize(self, text: str) -> List[Dict[str, Any]]:
        raw_tokens = self.split_tokens(text)
        return [self.parse_token(t) for t in raw_tokens if t]


normalizer = IngredientNormalizer()
