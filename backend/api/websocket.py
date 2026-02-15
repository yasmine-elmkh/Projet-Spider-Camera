"""
Gestionnaire de connexions WebSocket
Gère les connexions multiples et la diffusion de messages
"""

from fastapi import WebSocket
from typing import List

class ConnectionManager:
    def __init__(self):
        """
        Initialise le gestionnaire de connexions WebSocket
        """
        # Liste des connexions WebSocket actives
        self.active_connections: List[WebSocket] = []
        print("✅ ConnectionManager initialisé")
    
    async def connect(self, websocket: WebSocket):
        """
        Accepte une nouvelle connexion WebSocket
        
        Args:
            websocket: Connexion WebSocket à accepter
        """
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"🔌 Nouvelle connexion WebSocket. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """
        Supprime une connexion WebSocket de la liste
        
        Args:
            websocket: Connexion à supprimer
        """
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"🔌 Connexion WebSocket fermée. Total: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """
        Envoie un message à une connexion spécifique
        
        Args:
            message: Message à envoyer
            websocket: Connexion destinataire
        """
        await websocket.send_text(message)
    
    async def broadcast(self, message: str):
        """
        Diffuse un message à toutes les connexions actives
        
        Args:
            message: Message à diffuser
        """
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"❌ Erreur lors de l'envoi: {e}")
                # La connexion sera nettoyée lors de la prochaine tentative
    
    async def broadcast_json(self, data: dict):
        """
        Diffuse des données JSON à toutes les connexions actives
        
        Args:
            data: Données à diffuser au format dictionnaire
        """
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception as e:
                print(f"❌ Erreur lors de l'envoi JSON: {e}")
    
    def get_connection_count(self) -> int:
        """
        Retourne le nombre de connexions actives
        """
        return len(self.active_connections)