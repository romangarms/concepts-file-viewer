import plistlib
import struct
import numpy as np
import matplotlib.pyplot as plt

def clamp_rgb(color):
    return tuple(max(0.0, min(1.0, float(c))) for c in color[:3])

def decode_concepts_strokes(plist_path):
    with open(plist_path, "rb") as f:
        data = plistlib.load(f)

    objects = data["$objects"]
    root = objects[data["$top"]["root"].data]
    group_layer = objects[root["rootGroupLayers"].data]
    group_items = group_layer["NS.objects"]

    strokes = []

    for stroke_uid in group_items:
        stroke = objects[stroke_uid.data]
        if "groupItems" not in stroke:
            continue

        sub_items = stroke["groupItems"]
        sub_objs = objects[sub_items.data]["NS.objects"]
        for obj_uid in sub_objs:
            obj = objects[obj_uid.data]

            # 1. strokePoints45 or strokePointsNonOptionalAngles
            for field in ["strokePoints45", "strokePointsNonOptionalAngles"]:
                if field in obj:
                    uid = obj[field]
                    if hasattr(uid, "data"):
                        blob = objects[uid.data]
                        if isinstance(blob, bytes):
                            try:
                                points = np.frombuffer(blob, dtype=np.float32).reshape((-1, 4))
                                strokes.append(points[:, :2])  # x, y only
                                break
                            except Exception:
                                continue

                # 2. keyPoints → glPosition fallback
                elif "keyPoints" in obj:
                    kp_obj = objects[obj["keyPoints"].data]
                    kp_uids = kp_obj["NS.objects"]
                    decoded = []
                    for pt_uid in kp_uids:
                        pt = objects[pt_uid.data]
                        if "glPosition" in pt:
                            try:
                                x, y = struct.unpack("<ff", pt["glPosition"])
                                decoded.append((x, y))
                            except Exception:
                                pass
                    if decoded:
                        strokes.append(np.array(decoded))

    return strokes

def plot_strokes(strokes):
    plt.figure(figsize=(6, 6))
    for stroke in strokes:
        x, y = stroke[:, 0], stroke[:, 1]
        plt.plot(x, y, marker="o")
    plt.axis("equal")
    plt.title("Concepts Strokes (Unmodified Y)")
    plt.grid(True)
    plt.show()



# Optional CLI use
if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python extract_concepts_stroke.py Strokes.plist")
        sys.exit(1)

    strokes = decode_concepts_strokes(sys.argv[1])
    plot_strokes(strokes)
