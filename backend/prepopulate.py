import pandas as pd
import argparse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models

def get_or_create(session: Session, model, **kwargs):
    """Get an existing record or ceate a new one"""
    instance = session.query(model).filter_by(**kwargs).first()
    if instance:
        return instance
    
    instance = model(**kwargs)
    session.add(instance)
    session.commit()

    return instance


def parse_price(value):
    """Convert the int to float values."""
    if pd.isna(value):
        return None
    
    try:
        return float(str(value).replace(",", "").strip())
    except ValueError:
        return None
    


def parse_nhia(value):
    """Convert 'NHIA' to True, else False."""
    if isinstance(value, str) and "nhia" in value.lower():
        return True
    return False

def read_excel_sheets(file_path: str):
    """
    Reads all sheets in an Excel file and automatically detects the header row
    containing 'DRUGS DESCRIPTION'.
    """
    xls = pd.ExcelFile(file_path)
    sheets = {}

    for sheet_name in xls.sheet_names:
        df_preview =pd.read_excel(xls, sheet_name=sheet_name, header=None)
        header_row_index = None

        # find the row that contains the header keywords
        for i, row in df_preview.iterrows():
            if "DRUGS DESCRIPTION" in row.values:
                header_row_index = i
                break

        if header_row_index is not None:
            df = pd.read_excel(xls, sheet_name=sheet_name, header=header_row_index)
            sheets[sheet_name] = df
        else:
            print(f"⚠️ Could not find valid header in {sheet_name}, skipping.")

    return sheets



def populate_from_excel(file_path: str):
    db = SessionLocal()
    sheets = read_excel_sheets(file_path)

    try:
        for sheet_name, df in sheets.items():
            print(f"\n📄 Processing sheet: {sheet_name}")

            # Determine formulation type from sheet name
            formulation_type_name = sheet_name.strip().title()
            formulation_type = get_or_create(db, models.FormulationType, name=formulation_type_name)
            
            # Clean header names
            df.columns = [str(c).strip().lower() for c in df.columns]


            # Trying to rename and normalize common header variations
            rename_map = {
                "drug description": "drugs description",
                "drug descriptions": "drugs description",
                "brand name": "brand names",
                "brands": "brand names",
                "strength": "str",
                "nhia": "nhia/na",
                "nhia/na": "nhia/na",
            }

            df.rename(columns=lambda c: rename_map.get(c, c), inplace=True)

            required_cols = ["drugs description", "brand names", "str", "unit", "sp", "nhia/na"]
            if not all(col in df.columns for col in required_cols):
                print(f"⚠️ Missing expected columns in {sheet_name}, skipping.")
                print(f"🧾 Found columns instead: {list(df.columns)}")
                continue


            for _, row in df.iterrows():
                drug_name = str(row["drugs description"]).strip()
                brand_name = str(row["brand names"]).strip()
                strength = str(row["str"]).strip() if not pd.isna(row["str"]) else None
                unit_code = str(row["unit"]).strip().upper() if not pd.isna(row["unit"]) else None
                price = parse_price(row["sp"])
                nhia_cover = parse_nhia(row["nhia/na"])


                if not drug_name or not unit_code:
                    continue


                # create or get records
                drug = get_or_create(db, models.Drug, name=drug_name)
                brand = get_or_create(db, models.Brand,name=brand_name) if brand_name else None
                unit = get_or_create(db, models.Unit, code=unit_code, name=unit_code)

                # create product table
                product = models.Product(
                    drug_id=drug.id,
                    brand_id=brand.id if brand else None,
                    formulation_type_id=formulation_type.id,
                    strength=strength,
                    unit_id=unit.id if unit else None,
                    price=price,
                    nhia_cover=nhia_cover,
                )

                db.add(product)
            try:
                db.commit()
                print(f"✅ Completed: {len(df)} records added from '{sheet_name}'")
            except IntegrityError as e:
                db.rollback()
                print(f"⚠️ Integrity error while inserting into {sheet_name}: {e}")

    finally:
        db.close()
        print("\n🎯 All sheets processed successfully.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Populate DB form Excel")
    parser.add_argument("--file", required=True, help="Path to Excel file")
    args = parser.parse_args()

    from app.database import engine
    from app import models

    print("🧩 Creating tables (if not exist)...")
    models.Base.metadata.create_all(bind=engine)

    populate_from_excel(args.file)
