class PatientInteractionAgent:
    def process_input(self, symptoms, age):
        # Clean and normalize input
        cleaned_symptoms = symptoms.strip().lower()
        # Assuming age is already an int
        return {
            "symptoms": cleaned_symptoms,
            "age": age
        }