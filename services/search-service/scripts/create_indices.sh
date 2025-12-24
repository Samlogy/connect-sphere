#!/usr/bin/env bash
set -e
ES=${ELASTIC_URL:-http://localhost:9200}


# posts index
curl -s -X PUT "$ES/posts" -H 'Content-Type: application/json' -d '{
    "settings": {
    "analysis": {
    "analyzer": {
        "autocomplete_analyzer": {
        "tokenizer": "autocomplete_tokenizer",
        "filter": ["lowercase"]
    },
    "autocomplete_search_analyzer": { "tokenizer": "lowercase" }
    },
    "tokenizer": {
        "autocomplete_tokenizer": {
            "type": "edge_ngram",
            "min_gram": 2,
            "max_gram": 20,
            "token_chars": ["letter", "digit", "whitespace"]
        }
    }
    }
    },
    "mappings": {
        "properties": {
        "id": { "type": "keyword" },
        "user_id": { "type": "keyword" },
        "title": { "type": "text", "analyzer": "autocomplete_analyzer", "search_analyzer": "autocomplete_search_analyzer" },
        "content": { "type": "text" },
        "tags": { "type": "keyword" },
        "media_url": { "type": "keyword" },
        "created_at": { "type": "date" }
    }
    }
}' || true


echo "Created posts index or it already exists"


# users index
curl -s -X PUT "$ES/users" -H 'Content-Type: application/json' -d '{
    "settings": { "analysis": { "analyzer": { "username_analyzer": { "tokenizer": "standard", "filter": ["lowercase"] } } } },
    "mappings": {
        "properties": {
            "id": { "type": "keyword" },
            "username": { "type": "text", "analyzer": "username_analyzer", "fields": { "raw": { "type": "keyword" } } },
            "bio": { "type": "text" },
            "avatar_url": { "type": "keyword" },
            "created_at": { "type": "date" }
        }
    }
}' || true


echo "Created users index or it already exists"


# products index
curl -s -X PUT "$ES/products" -H 'Content-Type: application/json' -d '{
    "settings": { "analysis": { "analyzer": { "product_analyzer": { "tokenizer": "standard", "filter": ["lowercase", "asciifolding"] } } } },
        "mappings": {
        "properties": {
            "id": { "type": "keyword" },
            "title": { "type": "text", "analyzer": "product_analyzer" },
            "description": { "type": "text", "analyzer": "product_analyzer" },
            "price": { "type": "double" },
            "seller_id": { "type": "keyword" },
            "created_at": { "type": "date" }
        }
    }
}' || true


echo "Created products index or it already exists"