from groq import Groq

class MedicalReasoningAgent:
    def reason(self, symptoms: str, age: int, api_key: str = None) -> str:
        if not api_key:
            return "Error: Groq API key is required for medical reasoning."
            
        try:
            client = Groq(api_key=api_key)
            
            prompt = f"""
            You are an expert Medical Reasoning AI Agent. Analyze the following patient data:
            Age: {age}
            Symptoms: {symptoms}
            
            Task:
            1. Assess the severity of the symptoms (Low, Medium, High).
            2. Identify any red flags or warning signs.
            3. Provide a highly detailed and elaborated professional medical reasoning.
            4. If the severity is Low, suggest some general self-care precautions and common specific over-the-counter medications.
            
            Format your response exactly like this:
            Severity: [Your Assessment]
            Red Flags: [List or 'None']
            Reasoning: [Highly detailed and elaborated explanation]
            Self-Care & Precautions: [Self care tips and OTC meds if Low severity, otherwise 'N/A']
            
            Disclaimer: End your response by reminding the user that this is an AI assessment and they should consult a real doctor for medical advice.
            """
            
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are a helpful and precise medical AI assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500,
            )
            
            return completion.choices[0].message.content
            
        except Exception as e:
            return f"Error connecting to Groq API: {str(e)}"