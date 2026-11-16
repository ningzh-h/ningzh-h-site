"""生成 exe 启动器图标：原版墨绿底 + 白色「N」。

用法（需要 Pillow）：
    python tools/make-icon.py

输出：
    tools/icon.ico
    tools/icon-256.png
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
SIZE = 1024
BG = (47, 111, 98, 255)
FG = (255, 255, 255, 255)

image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)

# 圆角方块
draw.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=int(SIZE * 0.25), fill=BG)

# 原版 favicon 的 N 路径（64 网格）放大到 1024
scale = SIZE / 64
points = [(20, 46), (20, 18), (44, 46), (44, 18)]
coords = [(x * scale, y * scale) for x, y in points]
stroke = int(6 * scale)

draw.line(coords, fill=FG, width=stroke, joint="curve")
for x, y in coords:
    radius = stroke / 2
    draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=FG)

image.save(ROOT / "icon-256.png", format="PNG")

icon = image.resize((256, 256), Image.Resampling.LANCZOS)
icon.save(
    ROOT / "icon.ico",
    format="ICO",
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)

print("已生成 tools/icon.ico 和 tools/icon-256.png")
