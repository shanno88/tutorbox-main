from typing import Any, Dict, List, Optional
import requests

from app.config import settings


class PaddleClient:
    def __init__(self) -> None:
        self.api_key = settings.paddle_api_key
        self.env = settings.paddle_env
        # 根据环境选择 API base URL（这里先写 v2 的示例，你可以按实际文档调整）
        if self.env == "live":
            self.base_url = "https://api.paddle.com"
        else:
            self.base_url = "https://sandbox-api.paddle.com"

        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
        )

    def create_checkout(
        self,
        price_id: str,
        customer_email: str,
        success_url: str,
        cancel_url: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        调 Paddle 的创建结账/交易接口，返回 checkout URL。
        具体 endpoint / payload 以后可以根据你选的 Paddle API 版本微调。
        """
        # 下面是伪代码结构，根据官方文档替换 path 和字段
        url = f"{self.base_url}/transactions"
        payload: Dict[str, Any] = {
            "items": [
                {
                    "price_id": price_id,
                    "quantity": 1,
                }
            ],
            "customer": {
                "email": customer_email,
            },
            "return_url": success_url,
            "cancel_url": cancel_url,
        }
        if metadata:
            payload["custom_data"] = metadata

        resp = self.session.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        # 假设返回里有 checkout_url 字段，你后续可以按真实结构调整
        return data
