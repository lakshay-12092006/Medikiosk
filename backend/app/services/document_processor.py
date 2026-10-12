# MediKiosk Medical Document Processor
# OCR + basic medical information extraction


import os
import pytesseract
import fitz

from PIL import Image


# Tesseract executable path
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def clean_document_text(text: str):
    """
    Clean extracted OCR text.
    """

    if not text:
        return ""

    cleaned_text = " ".join(text.split())

    return cleaned_text


def extract_text_from_image(file_path: str):
    """
    Extract text from JPG, JPEG or PNG using Tesseract OCR.
    """

    image = Image.open(file_path)

    text = pytesseract.image_to_string(
        image,
        lang="eng"
    )

    return clean_document_text(text)


def extract_text_from_pdf(file_path: str):
    """
    Extract text from PDF.

    First tries normal PDF text extraction.
    If no text is found, PDF pages are converted
    into images and OCR is performed.
    """

    document = fitz.open(file_path)

    extracted_text = []

    for page in document:

        # Try normal PDF text extraction
        page_text = page.get_text()

        if page_text.strip():

            extracted_text.append(page_text)

        else:

            # Convert PDF page into image
            pix = page.get_pixmap()

            image = Image.frombytes(
                "RGB",
                [pix.width, pix.height],
                pix.samples
            )

            # OCR on image
            ocr_text = pytesseract.image_to_string(
                image,
                lang="eng"
            )

            extracted_text.append(ocr_text)

    document.close()

    return clean_document_text(
        "\n".join(extracted_text)
    )


def extract_text_from_document(file_path: str):
    """
    Automatically detect file type
    and extract text.
    """

    extension = os.path.splitext(
        file_path
    )[1].lower()

    if extension in [".jpg", ".jpeg", ".png"]:

        return extract_text_from_image(
            file_path
        )

    elif extension == ".pdf":

        return extract_text_from_pdf(
            file_path
        )

    else:

        raise ValueError(
            "Unsupported document format"
        )


def extract_document_information(text: str):
    """
    Extract structured medical information
    from OCR/document text.
    """

    cleaned_text = clean_document_text(text)

    text_lower = cleaned_text.lower()

    result = {
        "document_text": cleaned_text,
        "medicines": [],
        "diagnoses": [],
        "investigations": [],
        "dates": []
    }

    # -------------------------------------------------
    # 1. DATE EXTRACTION
    # -------------------------------------------------

    import re

    date_patterns = [
        r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
        r"\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b"
    ]

    for pattern in date_patterns:

        matches = re.findall(
            pattern,
            cleaned_text
        )

        for date in matches:

            if date not in result["dates"]:
                result["dates"].append(date)

    # -------------------------------------------------
    # 2. MEDICINE EXTRACTION
    # -------------------------------------------------

    medicine_pattern = (
        r"\b(?:tablet|tab\.?|capsule|cap\.?|"
        r"syrup|injection)\s+"
        r"([A-Za-z][A-Za-z0-9-]*)"
        r"(?:\s+(\d+\s*(?:mg|ml|mcg|g)))?"
    )

    medicine_matches = re.findall(
        medicine_pattern,
        cleaned_text,
        re.IGNORECASE
    )

    for medicine_name, dosage in medicine_matches:

        medicine = medicine_name

        if dosage:
            medicine = f"{medicine_name} {dosage}"

        if medicine not in result["medicines"]:
            result["medicines"].append(medicine)
    # -------------------------------------------------
    # 3. DIAGNOSIS DETECTION
    # -------------------------------------------------

    diagnosis_keywords = [
        "diabetes mellitus",
        "hypertension",
        "high blood pressure",
        "infection",
        "anemia",
        "asthma",
        "arthritis",
        "migraine",
        "thyroid",
        "gastritis",
        "pneumonia"
    ]

    # Check only the diagnosis section of the document
    diagnosis_text = text_lower

    if "diagnosis" in text_lower:

        diagnosis_start = text_lower.find("diagnosis")

        diagnosis_text = text_lower[
            diagnosis_start:
        ]

        # Stop at the next major section if present
        next_sections = [
            "medications",
            "investigations",
            "follow-up",
            "follow up",
            "note"
        ]

        section_end = len(diagnosis_text)

        for section in next_sections:

            position = diagnosis_text.find(section)

            if position != -1 and position < section_end:
                section_end = position

        diagnosis_text = diagnosis_text[
            :section_end
        ]

    # Extract diagnoses only from diagnosis section
    for diagnosis in diagnosis_keywords:

        if diagnosis in diagnosis_text:

            result["diagnoses"].append(
                diagnosis.title()
            )

    # Remove duplicate/less-specific diagnosis
    if "Diabetes Mellitus" in result["diagnoses"]:

        result["diagnoses"] = [
            diagnosis
            for diagnosis in result["diagnoses"]
            if diagnosis != "Diabetes"
        ]
    # -------------------------------------------------
    # 4. INVESTIGATION DETECTION
    # -------------------------------------------------

    investigation_keywords = [
        "cbc",
        "hemoglobin",
        "blood sugar",
        "glucose",
        "hba1c",
        "lipid profile",
        "liver function test",
        "kidney function test",
        "urine test",
        "blood test",
        "x-ray",
        "mri",
        "ct scan",
        "ultrasound",
        "ecg"
    ]

    for investigation in investigation_keywords:

        if investigation in text_lower:

            result["investigations"].append(
                investigation.upper()
            )
    # -------------------------------------------------
    # 5. REMOVE DUPLICATES
    # -------------------------------------------------

    result["medicines"] = list(
        dict.fromkeys(result["medicines"])
    )

    result["diagnoses"] = list(
        dict.fromkeys(result["diagnoses"])
    )

    result["investigations"] = list(
        dict.fromkeys(result["investigations"])
    )

    result["dates"] = list(
        dict.fromkeys(result["dates"])
    )


    # -------------------------------------------------
    # 6. MEDICAL TIMELINE
    # -------------------------------------------------

    medical_timeline = []

    # Main medical visit date
    if result["dates"]:

        main_date = result["dates"][0]

        medical_timeline.append({
            "date": main_date,
            "event": "Medical Visit",
            "complaints": [],
            "diagnoses": result["diagnoses"],
            "medicines": result["medicines"],
            "investigations": result["investigations"]
        })


    # Detect chief complaint from document
    complaint_keywords = [
        "fever",
        "headache",
        "cough",
        "vomiting",
        "dizziness",
        "chest pain",
        "breathing difficulty"
    ]

    detected_complaints = []

    for complaint in complaint_keywords:

        if complaint in text_lower:

            detected_complaints.append(
                complaint.title()
            )


    # Add complaints to main timeline event
    if medical_timeline:

        medical_timeline[0]["complaints"] = (
            detected_complaints
        )


    # Follow-up date
    if len(result["dates"]) > 1:

        follow_up_date = result["dates"][1]

        medical_timeline.append({
            "date": follow_up_date,
            "event": "Follow-up",
            "complaints": [],
            "diagnoses": [],
            "medicines": [],
            "investigations": []
        })


    result["medical_timeline"] = medical_timeline


    return result
    