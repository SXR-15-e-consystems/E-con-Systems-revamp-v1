from typing import Annotated, Any

from bson import ObjectId
from pydantic import GetPydanticSchema
from pydantic_core import core_schema


def _validate_object_id(value: Any) -> ObjectId:
    if isinstance(value, ObjectId):
        return value
    if isinstance(value, str) and ObjectId.is_valid(value):
        return ObjectId(value)
    raise ValueError(f"Invalid ObjectId: {value}")


PyObjectId = Annotated[
    ObjectId,
    GetPydanticSchema(
        lambda _tp, _handler: core_schema.no_info_plain_validator_function(
            _validate_object_id,
            serialization=core_schema.plain_serializer_function_ser_schema(
                str, return_schema=core_schema.str_schema()
            ),
        )
    ),
]
