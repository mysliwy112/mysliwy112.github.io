import argparse
import json
from pathlib import Path
from typing import Literal


def main(
    input_path: Path,
    output_path: Path,
):
    description = {"events": {}, "images": {}}
    with open(input_path, "rb") as input:
        current_event_name = None
        current_frame = None
        current_image_name = None
        last_entity_type: None | Literal['event'] | Literal['frame'] | Literal['image'] = None
        for (line_no, line) in enumerate(input.readlines()):
            line_no += 1
            line = line.strip(b'\r\n')
            if len(line) == 0 or (line == b"ANN" and last_entity_type is None):
                continue
            elif line.startswith(b"author=") and last_entity_type is None:
                description["author"] = line[7:].decode("cp1250")
            elif line.startswith(b"transparency=") and last_entity_type is None:
                description["transparency"] = int(line[13:].decode("cp1250"))
            elif line.startswith(b"bpp=") and last_entity_type is None:
                description["bpp"] = int(line[4:].decode("cp1250"))
            elif line.startswith(b"Event="):
                current_event_name = line[6:].decode("cp1250")
                description["events"][current_event_name] = {"frames": []}
                last_entity_type = 'event'
            elif line.startswith(b"\tloop=") and last_entity_type == 'event':
                description["events"][current_event_name]["loop"] = int(line[6:].decode("cp1250"))
            elif line.startswith(b"\ttransparency=") and last_entity_type == 'event':
                description["events"][current_event_name]["transparency"] = int(
                    line[14:].decode("cp1250")
                )
            elif line.startswith(b"\tFrame="):
                current_frame = {"filename": line[7:].decode("cp1250")}
                description["events"][current_event_name]["frames"].append(
                    current_frame
                )
                last_entity_type = 'frame'
            elif line.startswith(b"\t\tname=") and last_entity_type == 'frame':
                current_frame["name"] = line[7:].decode("cp1250")
            elif line.startswith(b"\t\tposition_x=") and last_entity_type == 'frame':
                current_frame["position_x"] = int(line[13:].decode("cp1250"))
            elif line.startswith(b"\t\tposition_y=") and last_entity_type == 'frame':
                current_frame["position_y"] = int(line[13:].decode("cp1250"))
            elif line.startswith(b"\t\tcheck=") and last_entity_type == 'frame':
                current_frame["check"] = list(map(int, line[8:]))
            elif line.startswith(b"\t\tsfx=") and last_entity_type == 'frame':
                current_frame["sfx"] = line[6:].decode("cp1250")
            elif line.startswith(b"\t\tsfx_seed=") and last_entity_type == 'frame':
                current_frame["sfx_seed"] = int(line[11:].decode("cp1250"))
            elif line.startswith(b"image="):
                current_image_name = line[6:].decode("cp1250")
                description["images"][current_image_name] = {}
                last_entity_type = 'image'
            elif line.startswith(b"\tname=") and last_entity_type == 'image':
                description["images"][current_image_name]["name"] = line[6:].decode("cp1250")
            elif line.startswith(b"\tposition_x=") and last_entity_type == 'image':
                description["images"][current_image_name]["position_x"] = int(line[12:].decode("cp1250"))
            elif line.startswith(b"\tposition_y=") and last_entity_type == 'image':
                description["images"][current_image_name]["position_y"] = int(line[12:].decode("cp1250"))
            elif line.startswith(b"\tcompression=") and last_entity_type == 'image':
                description["images"][current_image_name]["compression"] = int(line[13:].decode("cp1250"))
            else:
                raise Exception(f"Error parsing line {line_no} in state {last_entity_type}: {line}")
    with open(output_path, "w") as output:
        json.dump(description, output, indent=4)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert .mann animation description file to .json"
    )
    parser.add_argument(
        "input",
        type=Path,
        help="path to the input .mann file",
    )
    parser.add_argument(
        "output",
        type=Path,
        nargs="?",
        help="path to the output .json file; if optional, the input path with changed extension is used",
    )
    args = parser.parse_args()

    main(
        args.input,
        args.output or args.input.with_suffix(".json"),
    )
