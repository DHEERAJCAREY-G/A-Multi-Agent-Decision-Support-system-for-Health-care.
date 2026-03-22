class EscalationAgent:
    def decide_escalation(self, current_risk, previous_risk):
        if current_risk == "High":
            return "Visit hospital immediately"
        elif current_risk == "Medium":
            return "Consult a doctor"
        elif current_risk == "Low":
            return "Self-care and rest recommended"
        
        # Check if worsening
        if previous_risk == "Medium" and current_risk == "High":
            return "Condition worsening. Seek emergency care."
        
        return "Self-care and rest recommended"