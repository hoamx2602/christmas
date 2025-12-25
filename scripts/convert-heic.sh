#!/bin/bash

# Script convert HEIC to JPG, tạo thumbnails cho tất cả ảnh
# Chạy: ./scripts/convert-heic.sh

ORNAMENTS_DIR="./public/ornaments"
THUMBS_DIR="./public/ornaments/thumbs"

# Kiểm tra thư mục tồn tại
if [ ! -d "$ORNAMENTS_DIR" ]; then
    echo "Tạo thư mục $ORNAMENTS_DIR..."
    mkdir -p "$ORNAMENTS_DIR"
fi

# Tạo thư mục thumbs
mkdir -p "$THUMBS_DIR"

# Kiểm tra có sips (macOS built-in) không
if ! command -v sips &> /dev/null; then
    echo "Lỗi: sips không tìm thấy. Script này chỉ chạy trên macOS."
    exit 1
fi

cd "$ORNAMENTS_DIR"

# === PHẦN 1: Convert HEIC sang JPG ===
echo ""
echo "=== CONVERT HEIC TO JPG ==="

shopt -s nullglob
heic_files=(*.HEIC *.heic)
heic_count=${#heic_files[@]}

if [ "$heic_count" -eq 0 ]; then
    echo "Không có file HEIC nào cần convert."
else
    echo "Tìm thấy $heic_count file HEIC. Đang convert..."

    converted=0
    for f in "${heic_files[@]}"; do
        newname="${f%.*}.jpg"
        echo "Converting: $f -> $newname"
        sips -s format jpeg "$f" --out "$newname" > /dev/null 2>&1

        if [ $? -eq 0 ]; then
            rm "$f"
            echo "  ✓ Done, đã xoá $f"
            ((converted++))
        else
            echo "  ✗ Lỗi convert $f"
        fi
    done

    echo "Đã convert $converted file HEIC."
fi

# === PHẦN 2: Tạo thumbnails cho tất cả ảnh ===
echo ""
echo "=== TẠO THUMBNAILS ==="

thumb_created=0
for f in *.jpg *.jpeg *.png *.JPG *.JPEG *.PNG; do
    [ -e "$f" ] || continue

    # Tên file thumbnail
    thumbname="thumbs/${f%.*}_thumb.jpg"

    # Bỏ qua nếu thumbnail đã tồn tại và mới hơn file gốc
    if [ -f "$thumbname" ] && [ "$thumbname" -nt "$f" ]; then
        continue
    fi

    echo "Creating thumbnail: $f -> $thumbname"

    # Resize xuống max 300px (giữ tỉ lệ) và nén chất lượng 70%
    sips -Z 300 -s format jpeg -s formatOptions 70 "$f" --out "$thumbname" > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        ((thumb_created++))
    else
        echo "  ✗ Lỗi tạo thumbnail $f"
    fi
done

echo "Đã tạo $thumb_created thumbnails mới."

# === PHẦN 3: Thống kê ===
echo ""
echo "========================================="
echo "HOÀN THÀNH!"
echo "========================================="
echo ""
echo "Ảnh gốc:"
ls -lh *.jpg *.jpeg *.png 2>/dev/null | awk '{print "  " $9 ": " $5}'
echo ""
echo "Thumbnails:"
ls -lh thumbs/*.jpg 2>/dev/null | awk '{print "  " $9 ": " $5}'
echo ""

# Tính tổng dung lượng
orig_size=$(du -sh . 2>/dev/null | awk '{print $1}')
thumb_size=$(du -sh thumbs 2>/dev/null | awk '{print $1}')
echo "Tổng dung lượng ảnh gốc: $orig_size"
echo "Tổng dung lượng thumbnails: $thumb_size"
