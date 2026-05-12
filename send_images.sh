#!/bin/bash

TOKEN=$(curl -s -X POST "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"app_id":"cli_aa8b1485e63bdbc3","app_secret":"Wkn3n6yK0Byujw3N23khKcVuzNl1X8sA"}' \
  | grep -o '"tenant_access_token":"[^"]*"' | cut -d'"' -f4)

WEBHOOK="06844d98-f23d-4a5f-a27e-e4665d021d96"
IMAGE_DIR="C:/c-cc/seedance-images"

files=("$IMAGE_DIR"/*.jpg)
count=${#files[@]}
if [ $count -gt 5 ]; then count=5; fi

echo "Sending $count images..."

for ((i=0; i<count; i++)); do
    file="${files[$i]}"
    filename=$(basename "$file")
    echo "[$((i+1))/$count] $filename"

    # 上传图片
    image_key=$(curl -s -X POST "https://open.feishu.cn/open-apis/im/v1/images" \
      -H "Authorization: Bearer $TOKEN" \
      -F "image_type=message" \
      -F "image=@$file;type=image/jpeg" \
      | grep -o '"image_key":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$image_key" ]; then
        # 发送图片
        result=$(curl -s -X POST "https://open.feishu.cn/open-apis/bot/v2/hook/$WEBHOOK" \
          -H "Content-Type: application/json; charset=utf-8" \
          -d "{\"msg_type\":\"image\",\"content\":{\"image_key\":\"$image_key\"}}")

        if echo "$result" | grep -q '"code":0'; then
            echo "  ✅ Sent!"
        else
            echo "  ❌ Failed"
        fi
    else
        echo "  ❌ Upload failed"
    fi

    sleep 0.5
done

echo "Done!"
