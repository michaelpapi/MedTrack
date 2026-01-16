CREATE TABLE formulation_type (
    id INTEGER PRIIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE unit(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT
);


CREATE TABLE drug (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE brand (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOOT NULL UNIQUE
)

CREATE TABLE product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drug_id INTEGER NOT NULL,
    brand_id INTEGER,
    formulation_type_id INTEGER NOT NULL,
    strength TEXT,
    unit_id INTEGER,
    price REAL,
    nhia_cover BOOLEAN DEFAULT 0,
    stock INTEGER DEFAULT 0,
    last_changed_date TEXT,
    notes TEXT,

    FOREIGN KEY (drug_id) REFERENCES drug(id),
    FOREIGN KEY (brand_id) REFERENCES brand(id)
    FOREIGN KEY (formulation_type_id) REFERENCES formulation_type(id),
    FOREIGN KEY (unit_id) REFERENCES unit(id)
)


