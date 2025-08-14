/*
  # Kreye done model pou rapò yo

  1. Done Egzanp yo
    - Kategori yo (Electronics, Clothing, Food, etc.)
    - Founisè yo (Tech Suppliers, Fashion Distributors, etc.)
    - Pwodwi yo ak stock ak pri yo
    - Mouvman stock yo
    - Vant egzanp yo

  2. Fonksyon yo
    - Fonksyon pou kreye done egzanp yo
    - Fonksyon pou jere rapò yo

  3. Sekirite
    - Asire w ke done yo aksesib selon wòl itilizatè yo
*/

-- Kreye kategori egzanp yo ak verifye si yo egziste deja
DO $$
BEGIN
    -- Electronics
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Electronics') THEN
        INSERT INTO categories (name, description, is_active) VALUES
        ('Electronics', 'Aparèy elektwonik ak teknoloji', true);
    END IF;
    
    -- Clothing
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Clothing') THEN
        INSERT INTO categories (name, description, is_active) VALUES
        ('Clothing', 'Rad ak akseswa', true);
    END IF;
    
    -- Food & Beverages
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Food & Beverages') THEN
        INSERT INTO categories (name, description, is_active) VALUES
        ('Food & Beverages', 'Manje ak bweson', true);
    END IF;
    
    -- Home & Garden
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Home & Garden') THEN
        INSERT INTO categories (name, description, is_active) VALUES
        ('Home & Garden', 'Bagay pou kay ak jaden', true);
    END IF;
    
    -- Sports & Outdoors
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Sports & Outdoors') THEN
        INSERT INTO categories (name, description, is_active) VALUES
        ('Sports & Outdoors', 'Ekipman pou espò ak deyò', true);
    END IF;
    
    -- Books & Media
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Books & Media') THEN
        INSERT INTO categories (name, description, is_active) VALUES
        ('Books & Media', 'Liv ak medya', true);
    END IF;
    
    -- Health & Beauty
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Health & Beauty') THEN
        INSERT INTO categories (name, description, is_active) VALUES
        ('Health & Beauty', 'Sante ak bote', true);
    END IF;
    
    -- Automotive
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Automotive') THEN
        INSERT INTO categories (name, description, is_active) VALUES
        ('Automotive', 'Bagay pou machin', true);
    END IF;
END $$;

-- Kreye founisè egzanp yo ak verifye si yo egziste deja
DO $$
BEGIN
    -- Tech Solutions Inc
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Tech Solutions Inc') THEN
        INSERT INTO suppliers (name, contact_person, email, phone, address, is_active) VALUES
        ('Tech Solutions Inc', 'Jean Baptiste', 'jean@techsolutions.com', '+509 1234-5678', 'Port-au-Prince, Haiti', true);
    END IF;
    
    -- Fashion Distributors
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Fashion Distributors') THEN
        INSERT INTO suppliers (name, contact_person, email, phone, address, is_active) VALUES
        ('Fashion Distributors', 'Marie Dupont', 'marie@fashiondist.com', '+509 2345-6789', 'Cap-Haïtien, Haiti', true);
    END IF;
    
    -- Food Wholesale Co
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Food Wholesale Co') THEN
        INSERT INTO suppliers (name, contact_person, email, phone, address, is_active) VALUES
        ('Food Wholesale Co', 'Pierre Louis', 'pierre@foodwholesale.com', '+509 3456-7890', 'Les Cayes, Haiti', true);
    END IF;
    
    -- Home Essentials
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Home Essentials') THEN
        INSERT INTO suppliers (name, contact_person, email, phone, address, is_active) VALUES
        ('Home Essentials', 'Anne Michel', 'anne@homeessentials.com', '+509 4567-8901', 'Gonaïves, Haiti', true);
    END IF;
    
    -- Sports Equipment Ltd
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Sports Equipment Ltd') THEN
        INSERT INTO suppliers (name, contact_person, email, phone, address, is_active) VALUES
        ('Sports Equipment Ltd', 'Paul Morin', 'paul@sportsequip.com', '+509 5678-9012', 'Jacmel, Haiti', true);
    END IF;
    
    -- Book Paradise
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Book Paradise') THEN
        INSERT INTO suppliers (name, contact_person, email, phone, address, is_active) VALUES
        ('Book Paradise', 'Sophie Celestin', 'sophie@bookparadise.com', '+509 6789-0123', 'Port-au-Prince, Haiti', true);
    END IF;
    
    -- Beauty Supply Co
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Beauty Supply Co') THEN
        INSERT INTO suppliers (name, contact_person, email, phone, address, is_active) VALUES
        ('Beauty Supply Co', 'Carla Joseph', 'carla@beautysupply.com', '+509 7890-1234', 'Pétion-Ville, Haiti', true);
    END IF;
    
    -- Auto Parts Plus
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Auto Parts Plus') THEN
        INSERT INTO suppliers (name, contact_person, email, phone, address, is_active) VALUES
        ('Auto Parts Plus', 'Robert Francois', 'robert@autoparts.com', '+509 8901-2345', 'Delmas, Haiti', true);
    END IF;
END $$;

-- Kreye pwodwi egzanp yo
DO $$
DECLARE
    electronics_id uuid;
    clothing_id uuid;
    food_id uuid;
    home_id uuid;
    sports_id uuid;
    books_id uuid;
    health_id uuid;
    auto_id uuid;
    tech_supplier_id uuid;
    fashion_supplier_id uuid;
    food_supplier_id uuid;
    home_supplier_id uuid;
    sports_supplier_id uuid;
    book_supplier_id uuid;
    beauty_supplier_id uuid;
    auto_supplier_id uuid;
BEGIN
    -- Jwenn ID kategori yo
    SELECT id INTO electronics_id FROM categories WHERE name = 'Electronics' LIMIT 1;
    SELECT id INTO clothing_id FROM categories WHERE name = 'Clothing' LIMIT 1;
    SELECT id INTO food_id FROM categories WHERE name = 'Food & Beverages' LIMIT 1;
    SELECT id INTO home_id FROM categories WHERE name = 'Home & Garden' LIMIT 1;
    SELECT id INTO sports_id FROM categories WHERE name = 'Sports & Outdoors' LIMIT 1;
    SELECT id INTO books_id FROM categories WHERE name = 'Books & Media' LIMIT 1;
    SELECT id INTO health_id FROM categories WHERE name = 'Health & Beauty' LIMIT 1;
    SELECT id INTO auto_id FROM categories WHERE name = 'Automotive' LIMIT 1;

    -- Jwenn ID founisè yo
    SELECT id INTO tech_supplier_id FROM suppliers WHERE name = 'Tech Solutions Inc' LIMIT 1;
    SELECT id INTO fashion_supplier_id FROM suppliers WHERE name = 'Fashion Distributors' LIMIT 1;
    SELECT id INTO food_supplier_id FROM suppliers WHERE name = 'Food Wholesale Co' LIMIT 1;
    SELECT id INTO home_supplier_id FROM suppliers WHERE name = 'Home Essentials' LIMIT 1;
    SELECT id INTO sports_supplier_id FROM suppliers WHERE name = 'Sports Equipment Ltd' LIMIT 1;
    SELECT id INTO book_supplier_id FROM suppliers WHERE name = 'Book Paradise' LIMIT 1;
    SELECT id INTO beauty_supplier_id FROM suppliers WHERE name = 'Beauty Supply Co' LIMIT 1;
    SELECT id INTO auto_supplier_id FROM suppliers WHERE name = 'Auto Parts Plus' LIMIT 1;

    -- Ajoute pwodwi yo ak verifye si yo egziste deja
    -- Electronics
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'ELEC001') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('ELEC001', 'Samsung Galaxy Phone', 'Telefòn entèlijan Samsung ak karaktè modèn yo', electronics_id, tech_supplier_id, 599.99, 450.00, 25, 5, 50, 'pcs', '1234567890123', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'ELEC002') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('ELEC002', 'Apple iPhone', 'iPhone ak teknoloji pi resan an', electronics_id, tech_supplier_id, 899.99, 700.00, 15, 3, 30, 'pcs', '1234567890124', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'ELEC003') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('ELEC003', 'Laptop Dell', 'Òdinatè pòtatif pou travay ak etid', electronics_id, tech_supplier_id, 1299.99, 1000.00, 8, 2, 20, 'pcs', '1234567890125', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'ELEC004') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('ELEC004', 'Bluetooth Headphones', 'Ekoutè san fil ak son kalite wo', electronics_id, tech_supplier_id, 89.99, 60.00, 45, 10, 100, 'pcs', '1234567890126', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'ELEC005') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('ELEC005', 'Smart TV 55"', 'Televizyon entèlijan 55 pous', electronics_id, tech_supplier_id, 799.99, 600.00, 12, 3, 25, 'pcs', '1234567890127', true);
    END IF;

    -- Clothing
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'CLTH001') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('CLTH001', 'Men T-Shirt', 'T-shirt pou gason ak kalite bon', clothing_id, fashion_supplier_id, 19.99, 12.00, 150, 20, 300, 'pcs', '2234567890123', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'CLTH002') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('CLTH002', 'Women Dress', 'Rob pou fanm ak estil modèn', clothing_id, fashion_supplier_id, 49.99, 30.00, 75, 15, 150, 'pcs', '2234567890124', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'CLTH003') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('CLTH003', 'Jeans Pants', 'Pantalon jeans ak kalite wo', clothing_id, fashion_supplier_id, 39.99, 25.00, 100, 20, 200, 'pcs', '2234567890125', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'CLTH004') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('CLTH004', 'Sneakers', 'Soulye espò ak konfò', clothing_id, fashion_supplier_id, 79.99, 50.00, 60, 10, 120, 'pcs', '2234567890126', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'CLTH005') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('CLTH005', 'Baseball Cap', 'Chapo ak estil espò', clothing_id, fashion_supplier_id, 24.99, 15.00, 80, 15, 160, 'pcs', '2234567890127', true);
    END IF;

    -- Food & Beverages
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'FOOD001') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('FOOD001', 'Rice 25lb', 'Diri ak kalite bon 25 liv', food_id, food_supplier_id, 18.99, 12.00, 200, 30, 500, 'bag', '3234567890123', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'FOOD002') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('FOOD002', 'Cooking Oil 1L', 'Lwil pou kwit manje 1 lit', food_id, food_supplier_id, 4.99, 3.00, 180, 25, 400, 'bottle', '3234567890124', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'FOOD003') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('FOOD003', 'Canned Beans', 'Pwa nan bwat konsèv', food_id, food_supplier_id, 2.49, 1.50, 300, 50, 600, 'can', '3234567890125', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'FOOD004') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('FOOD004', 'Bottled Water 24pk', 'Dlo nan boutèy pak 24', food_id, food_supplier_id, 6.99, 4.00, 120, 20, 250, 'pack', '3234567890126', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'FOOD005') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('FOOD005', 'Coffee Beans 1lb', 'Grenn kafe 1 liv', food_id, food_supplier_id, 12.99, 8.00, 85, 15, 200, 'bag', '3234567890127', true);
    END IF;

    -- Home & Garden
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'HOME001') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('HOME001', 'Garden Hose 50ft', 'Tiyò jaden 50 pye', home_id, home_supplier_id, 29.99, 18.00, 40, 8, 80, 'pcs', '4234567890123', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'HOME002') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('HOME002', 'Lawn Mower', 'Machin pou koupe zèb', home_id, home_supplier_id, 299.99, 200.00, 15, 3, 30, 'pcs', '4234567890124', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'HOME003') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('HOME003', 'Plant Fertilizer', 'Angre pou plant yo', home_id, home_supplier_id, 14.99, 9.00, 90, 15, 180, 'bag', '4234567890125', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'HOME004') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('HOME004', 'Garden Tools Set', 'Zouti jaden yo nan yon sèt', home_id, home_supplier_id, 49.99, 30.00, 25, 5, 50, 'set', '4234567890126', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'HOME005') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('HOME005', 'Outdoor Chair', 'Chèz pou deyò ak konfò', home_id, home_supplier_id, 89.99, 60.00, 35, 8, 70, 'pcs', '4234567890127', true);
    END IF;

    -- Sports & Outdoors
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'SPRT001') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('SPRT001', 'Basketball', 'Boul basket ak kalite pwofesyonèl', sports_id, sports_supplier_id, 24.99, 15.00, 50, 10, 100, 'pcs', '5234567890123', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'SPRT002') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('SPRT002', 'Soccer Ball', 'Boul foutbòl ak estanda FIFA', sports_id, sports_supplier_id, 19.99, 12.00, 60, 12, 120, 'pcs', '5234567890124', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'SPRT003') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('SPRT003', 'Tennis Racket', 'Raket tenis ak teknoloji modèn', sports_id, sports_supplier_id, 89.99, 60.00, 20, 5, 40, 'pcs', '5234567890125', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'SPRT004') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('SPRT004', 'Camping Tent', 'Tant pou kanpe ak 4 moun', sports_id, sports_supplier_id, 149.99, 100.00, 18, 4, 35, 'pcs', '5234567890126', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'SPRT005') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('SPRT005', 'Fishing Rod', 'Kan pou pèch ak akseswa', sports_id, sports_supplier_id, 69.99, 45.00, 30, 6, 60, 'pcs', '5234567890127', true);
    END IF;

    -- Books & Media
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'BOOK001') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('BOOK001', 'Programming Book', 'Liv sou pwogramasyon ak egzanp yo', books_id, book_supplier_id, 39.99, 25.00, 40, 8, 80, 'pcs', '6234567890123', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'BOOK002') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('BOOK002', 'History of Haiti', 'Liv sou istwa Ayiti', books_id, book_supplier_id, 24.99, 15.00, 55, 10, 110, 'pcs', '6234567890124', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'BOOK003') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('BOOK003', 'Cooking Magazine', 'Magazin sou kwizin ak resèt yo', books_id, book_supplier_id, 4.99, 3.00, 100, 20, 200, 'pcs', '6234567890125', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'BOOK004') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('BOOK004', 'Music CD Collection', 'Koleksyon CD ak mizik popilè', books_id, book_supplier_id, 14.99, 9.00, 75, 15, 150, 'pcs', '6234567890126', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'BOOK005') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('BOOK005', 'Educational DVD', 'DVD ak kontni edikatif', books_id, book_supplier_id, 19.99, 12.00, 45, 9, 90, 'pcs', '6234567890127', true);
    END IF;

    -- Health & Beauty
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'HLTH001') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('HLTH001', 'Shampoo 500ml', 'Chanpou ak fòmil natirèl', health_id, beauty_supplier_id, 8.99, 5.00, 120, 20, 240, 'bottle', '7234567890123', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'HLTH002') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('HLTH002', 'Face Cream', 'Krèm pou figi ak pwoteksyon', health_id, beauty_supplier_id, 24.99, 15.00, 80, 15, 160, 'jar', '7234567890124', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'HLTH003') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('HLTH003', 'Vitamins 60ct', 'Vitamin ak 60 konprè', health_id, beauty_supplier_id, 19.99, 12.00, 95, 18, 190, 'bottle', '7234567890125', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'HLTH004') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('HLTH004', 'Toothpaste', 'Dentifris ak pwoteksyon konplè', health_id, beauty_supplier_id, 3.99, 2.50, 200, 30, 400, 'tube', '7234567890126', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'HLTH005') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('HLTH005', 'Hand Sanitizer', 'Dezenfèktan pou men ak 70% alkòl', health_id, beauty_supplier_id, 5.99, 3.50, 150, 25, 300, 'bottle', '7234567890127', true);
    END IF;

    -- Automotive
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'AUTO001') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('AUTO001', 'Motor Oil 5L', 'Lwil motè 5 lit ak kalite wo', auto_id, auto_supplier_id, 29.99, 18.00, 60, 12, 120, 'bottle', '8234567890123', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'AUTO002') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('AUTO002', 'Car Battery', 'Batri machin ak garanti 2 ane', auto_id, auto_supplier_id, 89.99, 60.00, 25, 5, 50, 'pcs', '8234567890124', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'AUTO003') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('AUTO003', 'Brake Pads', 'Plak fren ak teknoloji modèn', auto_id, auto_supplier_id, 49.99, 30.00, 40, 8, 80, 'set', '8234567890125', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'AUTO004') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('AUTO004', 'Air Filter', 'Filt lè pou motè ak pwoteksyon', auto_id, auto_supplier_id, 14.99, 9.00, 70, 14, 140, 'pcs', '8234567890126', true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM products WHERE code = 'AUTO005') THEN
        INSERT INTO products (code, name, description, category_id, supplier_id, unit_price, cost_price, current_stock, min_stock_level, max_stock_level, unit_of_measure, barcode, is_active) VALUES
        ('AUTO005', 'Windshield Wipers', 'Esui-glace ak teknoloji modèn', auto_id, auto_supplier_id, 19.99, 12.00, 55, 11, 110, 'pair', '8234567890127', true);
    END IF;
END $$;

-- Kreye kèk mouvman stock egzanp yo
DO $$
DECLARE
    product_record RECORD;
    admin_user_id uuid;
BEGIN
    -- Jwenn premye admin user la
    SELECT id INTO admin_user_id FROM users WHERE role = 'Admin' LIMIT 1;
    
    -- Si pa gen admin, kreye youn
    IF admin_user_id IS NULL THEN
        INSERT INTO users (username, email, full_name, role, is_active)
        VALUES ('admin', 'admin@debcargo.com', 'System Administrator', 'Admin', true)
        RETURNING id INTO admin_user_id;
    END IF;

    -- Ajoute kèk mouvman stock yo
    FOR product_record IN 
        SELECT id, current_stock FROM products 
        WHERE is_active = true 
        ORDER BY random() 
        LIMIT 10
    LOOP
        -- Ajoute mouvman IN (resèpsyon stock)
        INSERT INTO stock_movements (product_id, movement_type, quantity, unit_cost, reference_number, notes, user_id, created_at)
        VALUES (
            product_record.id,
            'IN',
            floor(random() * 50 + 10)::integer,
            random() * 20 + 5,
            'PO-' || floor(random() * 9999 + 1000)::text,
            'Resèpsyon stock nouvo',
            admin_user_id,
            now() - interval '1 day' * floor(random() * 30)
        );

        -- Ajoute mouvman OUT (vant)
        INSERT INTO stock_movements (product_id, movement_type, quantity, unit_cost, reference_number, notes, user_id, created_at)
        VALUES (
            product_record.id,
            'OUT',
            floor(random() * 10 + 1)::integer,
            NULL,
            'SALE-' || floor(random() * 9999 + 1000)::text,
            'Vant nan magazen',
            admin_user_id,
            now() - interval '1 day' * floor(random() * 15)
        );
    END LOOP;
END $$;

-- Kreye kèk vant egzanp yo
DO $$
DECLARE
    product_record RECORD;
    admin_user_id uuid;
    customer_names text[] := ARRAY['Jean Baptiste', 'Marie Dupont', 'Pierre Louis', 'Anne Michel', 'Paul Morin', 'Sophie Celestin', 'Carla Joseph', 'Robert Francois', 'Claude Moreau', 'Diane Petit'];
    scan_types text[] := ARRAY['manual', 'barcode', 'qr'];
BEGIN
    -- Jwenn premye admin user la
    SELECT id INTO admin_user_id FROM users WHERE role = 'Admin' LIMIT 1;
    
    -- Kreye vant egzanp yo
    FOR product_record IN 
        SELECT id, code, name, unit_price FROM products 
        WHERE is_active = true 
        ORDER BY random() 
        LIMIT 20
    LOOP
        INSERT INTO sales_records (
            product_code, 
            product_name, 
            quantity, 
            unit_price, 
            total_amount, 
            customer_name, 
            scan_type, 
            user_id, 
            created_at
        )
        VALUES (
            product_record.code,
            product_record.name,
            floor(random() * 5 + 1)::integer,
            product_record.unit_price,
            (floor(random() * 5 + 1)::integer * product_record.unit_price),
            customer_names[floor(random() * array_length(customer_names, 1) + 1)],
            scan_types[floor(random() * array_length(scan_types, 1) + 1)]::scan_type,
            admin_user_id,
            now() - interval '1 day' * floor(random() * 30)
        );
    END LOOP;
END $$;