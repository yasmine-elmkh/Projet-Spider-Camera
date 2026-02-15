"""
Encodeur JSON personnalisé pour gérer les types NumPy
"""

import json
import numpy as np

class NumpyEncoder(json.JSONEncoder):
    """
    Encodeur JSON qui gère les types NumPy
    """
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)


def convert_to_serializable(obj):
    """
    Convertit récursivement les types NumPy en types Python natifs
    """
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_to_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_to_serializable(item) for item in obj]
    return obj