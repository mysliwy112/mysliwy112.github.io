import argparse
from dataclasses import astuple, dataclass
import json
import logging
import os
from pathlib import Path
import subprocess
import sys

ANNDRZEM_ENV_KEY = "ANNDRZEM"
DEFAULT_INDEX_PATH = "./index.json"


class Anndrzem:
    def __init__(self, exec_path: Path):
        self.exec_path = exec_path

    def run(self, ann_path: Path, output_dir: Path):
        subprocess.run(
            [
                self.exec_path,
                ann_path,
                f"-d={output_dir}{os.sep}",
                "-j",
                "--full",
            ],
            input=b"n\n",
            timeout=10,
            check=True,
            capture_output=True,
        )


@dataclass
class DirMapping:
    """A pair of directory paths (absolute or relative) where one points to the source and the other to the destination.

    Attributes:
        src (Path): Source dir.
        dst (Path): Destination dir.

    """

    src: Path
    dst: Path

    def __iter__(self):
        return iter(astuple(self))

    def __str__(self) -> str:
        return f"{self.src}{os.pathsep}{self.dst}"

    @staticmethod
    def from_string(value: str) -> "DirMapping":
        if os.pathsep in value:
            src, dst = map(Path, value.split(os.pathsep))
        else:
            src = Path(value)
            dst = Path(src.name)
        return DirMapping(src, dst)


def main(
    anndrzem_path: str,
    index_path: str,
    output_path: str,
    search_roots: list[DirMapping],
    subdir_mappings: list[DirMapping],
    clear_index: bool = False,
    dry_run: bool = False,
    logger: logging.Logger | None = None,
):
    anndrzem = Anndrzem(anndrzem_path)
    index = []
    if not clear_index:
        try:
            with open(index_path, "r") as index_file:
                index = json.load(index_file)
        except FileNotFoundError:
            if logger:
                logger.warning(f"Index file '{index_path}' does not exist. Starting from square one. No, from zero.")
    index_set = set(map(lambda entry: f"{entry['path']}{os.sep}{entry['name']}".lower(), index))
    for search_root in search_roots:
        for dirpath, _, filenames in os.walk(search_root.src):
            output_subdir = Path(os.path.relpath(dirpath, search_root.src))
            output_subdir = Path(
                *map(
                    lambda part: next(
                        map(
                            lambda mapping: mapping.dst,
                            filter(
                                lambda mapping: part.lower() == str(mapping.src).lower(),
                                subdir_mappings,
                            ),
                        ),
                        part,
                    ),
                    output_subdir.parts,
                ),
            )
            output_subdir = search_root.dst / output_subdir
            if logger:
                logger.debug(f"Output subdir for source '{dirpath}' is '{output_subdir}'")
            for file in filenames:
                file = Path(file)
                if file.suffix.lower() != ".ann":
                    continue
                entry = {
                    "path": str(output_subdir).replace(os.sep, "/"),
                    "name": str(file.with_suffix("")),
                }
                if f"{entry['path']}{os.sep}{entry['name']}".lower() in index_set:
                    continue
                try:
                    if not dry_run:
                        anndrzem.run(
                            dirpath / file,
                            output_path / output_subdir,
                        )
                    index.append(entry)
                    if logger:
                        logger.info(f"Succesfully processed file '{file}' at '{dirpath}'")
                except Exception:
                    if logger:
                        logger.exception(f"Error processing file '{file}' at '{dirpath}'")
    if not dry_run:
        with open(index_path, "w") as index_file:
            json.dump(index, index_file, indent=2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Create/update the database of extracted .ann files"
    )
    parser.add_argument(
        "--anndrzem",
        required=os.environ.get(ANNDRZEM_ENV_KEY) is None,
        default=os.environ.get(ANNDRZEM_ENV_KEY),
        type=Path,
        help=f"path to the Anndrzem executable (can be also set using '{ANNDRZEM_ENV_KEY}' env)",
    )
    parser.add_argument(
        "--index",
        "-i",
        type=Path,
        default=DEFAULT_INDEX_PATH,
        help=f"path to the index of extracted files (default: '{DEFAULT_INDEX_PATH}')",
    )
    parser.add_argument(
        "--clear-index",
        action="store_true",
        help="clear the index of extracted files",
    )
    parser.add_argument(
        "--subdir-mapping",
        type=DirMapping.from_string,
        nargs="*",
        default=[
            DirMapping("dane", ""),
            DirMapping("game", ""),
            DirMapping("przygoda", ""),
            DirMapping("intro", ""),
            DirMapping("mainmenu", ""),
            DirMapping("reksioufo", ""),
            DirMapping("common", "_common"),
        ],
        help="mappings of path parts from source (the location of .ann) to destination (extracted images);\n"
        + f"pair elements are to be separated using OS path separator (which is '{os.pathsep}')",
    )
    parser.add_argument(
        "--dry-run",
        "-n",
        action="store_true",
        help="simulate the process without extracting .anns nor modifying the index of extracted files",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="enable debug logs",
    )
    parser.add_argument(
        "output_path", type=Path, help="output path for extracting .anns"
    )
    parser.add_argument(
        "search_root",
        type=DirMapping.from_string,
        nargs="+",
        help="mapping of search roots to subdirs inside the output path for extracting .anns;\n"
        + f"pair elements are to be separated using OS path separator (which is '{os.pathsep}')",
    )
    args = parser.parse_args()

    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG if args.verbose else logging.INFO)
    stdour_handler = logging.StreamHandler(sys.stdout)
    stdour_handler.setLevel(logging.DEBUG)
    stdour_handler.addFilter(lambda log: log.levelno <= logging.INFO)
    stderr_handler = logging.StreamHandler()
    stderr_handler.setLevel(logging.WARNING)
    logger.addHandler(stdour_handler)
    logger.addHandler(stderr_handler)

    main(
        args.anndrzem or os.environ.get("ANNDRZEM"),
        args.index,
        args.output_path,
        args.search_root,
        args.subdir_mapping,
        args.clear_index,
        args.dry_run,
        logger,
    )
