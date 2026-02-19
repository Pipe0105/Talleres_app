-- Normalizacion de roles solicitada:
-- - COORDINADOR(A) DE INVENTARIOS -> COORDINADOR
-- - COORDINADOR -> is_coordinator = TRUE
-- - AUXILIAR -> operario (is_admin = FALSE, is_gerente = FALSE, is_coordinator = FALSE, is_branch_admin = FALSE)

BEGIN;

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = TRUE, is_branch_admin = FALSE, sede = 'Calle 5ta'
WHERE full_name ILIKE 'HURTADO GOMEZ ALEXANDER';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = FALSE, is_branch_admin = FALSE, sede = 'Calle 5ta'
WHERE full_name ILIKE 'SANCHEZ CRUZ JULIAN DAVID';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = TRUE, is_branch_admin = FALSE, sede = 'La 39'
WHERE full_name ILIKE 'RAMIREZ BURBANO JUAN CAMILO';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = FALSE, is_branch_admin = FALSE, sede = 'La 39'
WHERE full_name ILIKE 'MUNOZ VELASCO RONALDO';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = TRUE, is_branch_admin = FALSE, sede = 'Plaza Norte'
WHERE full_name ILIKE 'ERAZO MARTINEZ CRISTIAN ANDRES';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = FALSE, is_branch_admin = FALSE, sede = 'Plaza Norte'
WHERE full_name ILIKE 'LOPEZ PINCAY JAMES';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = TRUE, is_branch_admin = FALSE, sede = 'Ciudad Jardín'
WHERE full_name ILIKE 'GUERRERO CARDONA SANTIAGO';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = FALSE, is_branch_admin = FALSE, sede = 'Ciudad Jardín'
WHERE full_name ILIKE 'LEANDRO MOLZALVE SANCHEZ';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = TRUE, is_branch_admin = FALSE, sede = 'Centro Sur'
WHERE full_name ILIKE 'OBREGON SOLIS FAIVER ANDRES';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = FALSE, is_branch_admin = FALSE, sede = 'Centro Sur'
WHERE full_name ILIKE 'TORRES ARBOLEDA YOSSI MAR';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = TRUE, is_branch_admin = FALSE, sede = 'Palmira'
WHERE full_name ILIKE 'BOTINA MUNOZ HAMILTHON ESTEBAN';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = FALSE, is_branch_admin = FALSE, sede = 'Palmira'
WHERE full_name ILIKE 'CAMPO SANTOS FELIPE';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = TRUE, is_branch_admin = FALSE, sede = 'Floresta'
WHERE full_name ILIKE 'MONTENEGRO CABRERA HANS LOUIE';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = FALSE, is_branch_admin = FALSE, sede = 'Floresta'
WHERE full_name ILIKE 'ESCOBAR FIGUEROA CARLOS ANDRÉS';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = TRUE, is_branch_admin = FALSE, sede = 'Floralia'
WHERE full_name ILIKE 'ASTACUAS BURBANO BETSY ROCIO';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = FALSE, is_branch_admin = FALSE, sede = 'Floralia'
WHERE full_name ILIKE 'UNI CHEPE JONNATAN';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = TRUE, is_branch_admin = FALSE, sede = 'Guaduales'
WHERE full_name ILIKE 'OYOLA LEDESMA CARLOS ANDRES';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = FALSE, is_branch_admin = FALSE, sede = 'Guaduales'
WHERE full_name ILIKE 'JUAN DANIEL PHYSCO VALDES';

-- Sin sede valida del catalogo actual: se deja en NULL
UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = TRUE, is_branch_admin = FALSE, sede = NULL
WHERE full_name ILIKE 'ARGOTTY HURTADO ANDRES FELIPE';

UPDATE users
SET is_admin = FALSE, is_gerente = FALSE, is_coordinator = FALSE, is_branch_admin = FALSE, sede = NULL
WHERE full_name ILIKE 'IVAN BURBANO';

COMMIT;
