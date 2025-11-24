import pathlib
import sys

ROOT_DIR = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
    
from app.data.materials import MATERIAL_CATALOG

def test_material_catalog_structure():
    assert set(MATERIAL_CATALOG.keys()) == {"res", "cerdo"}
    
    for specie, groups in MATERIAL_CATALOG.items():
        assert set (groups.keys()) == {"principales", "secundarios"}, specie
        for group_name, curs in groups.items():
            assert isinstance(cuts, list)
            assert len(cuts) == len(set(cuts)), group_name
            assert all(isinstance(cut, str) and cut for cut in cuts)
            
def test_material_catalog_values_match_reference():
    res_principales = MATERIAL_CATALOG["res"]["principales"]
    assert "AMPOLLETA NORMAL" in res_principales
    assert "LOMO VICHE ESPECIAL" in res_principales
    
    res_secundarios = MATERIAL_CATALOG["res"]["secundarios"]
    assert "33647 Recorte" in res_secundarios
    assert "22835 Gordana" in res_secundarios
    
    cerdo_principales = MATERIAL_CATALOG["cerdo"]["principales"]
    assert "COSTICHI" in cerdo_principales
    assert "TOCINETA" in cerdo_principales
    
    cerdo_secundarios = MATERIAL_CATALOG["cerdo"]["secundarios"]
    assert "5800 Empella" in cerdo_secundarios