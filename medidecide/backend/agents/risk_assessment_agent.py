import re

class RiskAssessmentAgent:
    def assess_risk(self, reasoning_output, age):
        # Default values
        severity = "Low"
        red_flags_str = ""
        
        # Robust parsing using regex (handles extra line breaks, spaces, or bold text)
        severity_match = re.search(r'(?i)Severity:\s*\*?\**(Low|Medium|High)', reasoning_output)
        if severity_match:
            severity = severity_match.group(1).capitalize()
            
        red_flags_match = re.search(r'(?i)Red Flags:\s*\*?\**(.*)', reasoning_output)
        if red_flags_match:
            # Take just the line it was found on
            red_flags_str = red_flags_match.group(1).split('\n')[0].strip('* ')
            
        red_flags = []
        if red_flags_str and red_flags_str.lower() not in ["none", "none.", "n/a", ""]:
            red_flags = [flag.strip().lower() for flag in red_flags_str.split(',')]
        
        score = 0
        # Check red flags safely
        if any("chest pain" in flag for flag in red_flags):
            score += 5
        if any("breathing difficulty" in flag for flag in red_flags) or any("shortness of breath" in flag for flag in red_flags):
            score += 5
            
        if severity == "High":
            score += 5
        elif severity == "Medium":
            score += 3
            
        if age > 60:
            score += 2
        
        if score >= 7:
            risk = "High"
        elif score >= 4:
            risk = "Medium"
        else:
            risk = "Low"
        
        return risk