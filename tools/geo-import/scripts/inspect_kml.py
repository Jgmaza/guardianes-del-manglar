#!/usr/bin/env python3
"""Inspect a CRA KMZ/KML export. Does not invent attributes."""

from __future__ import annotations

import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
KML = ROOT / "data/raw/kmz_extract/doc.kml"
OUT = ROOT / "data/inspection/inspection_report.json"


def parse_attrs(desc: str) -> dict[str, str]:
    return dict(re.findall(r"<td>([^<]+)</td>\s*<td>([^<]*)</td>", desc))


def main() -> None:
    text = KML.read_text(encoding="utf-8", errors="replace")
    sha = hashlib.sha256(KML.read_bytes()).hexdigest()

    report: dict = {
        "source_kml": str(KML),
        "kml_bytes": KML.stat().st_size,
        "kml_sha256": sha,
        "namespaces_declared": sorted(set(re.findall(r'xmlns(?::\w+)?="([^"]+)"', text[:5000]))),
        "document": {},
        "folders": [],
        "tag_counts": {},
        "geometry": {},
        "extended_data": {},
        "placemark_properties": {},
        "attribute_fields": {},
        "original_identifiers_observed": {},
        "groupings": {},
        "validity": {},
        "samples": [],
        "notes": [],
    }

    doc_name = re.search(r"<Document[^>]*>\s*<name>([^<]*)</name>", text)
    doc_id = re.search(r'<Document[^>]*\bid="([^"]+)"', text)
    report["document"] = {
        "id": doc_id.group(1) if doc_id else None,
        "name": doc_name.group(1) if doc_name else None,
    }

    for m in re.finditer(
        r"<Folder([^>]*)>\s*<name>([^<]*)</name>(?:\s*<Snippet></Snippet>)?(?:\s*<description><!\[CDATA\[(.*?)\]\]></description>)?",
        text,
        re.S,
    ):
        attrs, name, desc = m.group(1), m.group(2), (m.group(3) or "").strip()
        fid = re.search(r'\bid="([^"]+)"', attrs)
        report["folders"].append(
            {"id": fid.group(1) if fid else None, "name": name, "description": desc[:1000]}
        )

    tags = [
        "Document",
        "Folder",
        "Placemark",
        "Polygon",
        "MultiGeometry",
        "Point",
        "LineString",
        "LinearRing",
        "outerBoundaryIs",
        "innerBoundaryIs",
        "coordinates",
        "ExtendedData",
        "SchemaData",
        "SimpleData",
        "Data",
        "Schema",
        "SimpleField",
        "styleUrl",
        "Style",
        "description",
        "name",
        "Snippet",
    ]
    for t in tags:
        report["tag_counts"][t] = len(re.findall(rf"<{t}(?:\s|>)", text))

    report["extended_data"] = {
        "ExtendedData_count": report["tag_counts"]["ExtendedData"],
        "SchemaData_count": report["tag_counts"]["SchemaData"],
        "SimpleData_count": report["tag_counts"]["SimpleData"],
        "Data_count": report["tag_counts"]["Data"],
        "Schema_count": report["tag_counts"]["Schema"],
        "attribute_storage": (
            "html_description_tables"
            if report["tag_counts"]["ExtendedData"] == 0
            else "mixed_or_extended"
        ),
    }

    geom_types: Counter[str] = Counter()
    empty_coords = 0
    invalid_coord_tokens = 0
    vertex_count = 0
    small_rings = 0
    minx = miny = float("inf")
    maxx = maxy = float("-inf")
    ring_counts: Counter[int] = Counter()
    holes = 0
    placemark_total = 0
    ids: list[str] = []
    names: Counter[str] = Counter()
    style_urls: Counter[str] = Counter()
    missing_name = 0
    missing_id = 0
    attr_field_presence: Counter[str] = Counter()
    attr_value_examples: dict[str, list[str]] = defaultdict(list)
    attr_value_counts: dict[str, Counter[str]] = defaultdict(Counter)
    parse_attr_errors = 0
    no_attr_table = 0
    samples: list[dict] = []

    placemark_re = re.compile(r"<Placemark([^>]*)>(.*?)</Placemark>", re.S)

    for m in placemark_re.finditer(text):
        placemark_total += 1
        attrs_xml, body = m.group(1), m.group(2)
        pid = re.search(r'\bid="([^"]+)"', attrs_xml)
        if pid:
            ids.append(pid.group(1))
        else:
            missing_id += 1
        nm = re.search(r"<name>([^<]*)</name>", body)
        if nm and nm.group(1).strip():
            names[nm.group(1)] += 1
        else:
            missing_name += 1
        su = re.search(r"<styleUrl>([^<]*)</styleUrl>", body)
        if su:
            style_urls[su.group(1)] += 1

        has_multi = "<MultiGeometry" in body
        poly_count = len(re.findall(r"<Polygon[\s>]", body))
        point_count = len(re.findall(r"<Point[\s>]", body))
        line_count = len(re.findall(r"<LineString[\s>]", body))
        rings = len(re.findall(r"<LinearRing[\s>]", body))
        inners = len(re.findall(r"<innerBoundaryIs[\s>]", body))
        holes += inners
        ring_counts[rings] += 1

        if has_multi and poly_count:
            geom_types["MultiGeometry>Polygon"] += 1
        elif poly_count > 1:
            geom_types["multiple_Polygon"] += 1
        elif poly_count == 1:
            geom_types["Polygon"] += 1
        elif point_count:
            geom_types["Point"] += 1
        elif line_count:
            geom_types["LineString"] += 1
        else:
            geom_types["unknown_or_empty"] += 1

        coords_blocks = re.findall(r"<coordinates>\s*([^<]*)</coordinates>", body)
        verts: list[tuple[float, float]] = []
        empty = not coords_blocks
        for cb in coords_blocks:
            tokens = cb.split()
            if not tokens:
                empty = True
                continue
            if 0 < len(tokens) < 4:
                small_rings += 1
            for tok in tokens:
                parts = tok.split(",")
                if len(parts) < 2:
                    invalid_coord_tokens += 1
                    continue
                try:
                    lon = float(parts[0])
                    lat = float(parts[1])
                except ValueError:
                    invalid_coord_tokens += 1
                    continue
                if not (-180 <= lon <= 180 and -90 <= lat <= 90):
                    invalid_coord_tokens += 1
                    continue
                verts.append((lon, lat))
                vertex_count += 1
                minx = min(minx, lon)
                maxx = max(maxx, lon)
                miny = min(miny, lat)
                maxy = max(maxy, lat)

        if empty or not verts:
            empty_coords += 1

        desc_m = re.search(r"<description><!\[CDATA\[(.*?)\]\]></description>", body, re.S)
        if desc_m:
            try:
                pairs = parse_attrs(desc_m.group(1))
                if not pairs:
                    no_attr_table += 1
                for k, v in pairs.items():
                    attr_field_presence[k] += 1
                    attr_value_counts[k][v] += 1
                    if len(attr_value_examples[k]) < 5 and v not in attr_value_examples[k]:
                        attr_value_examples[k].append(v)
            except Exception:
                parse_attr_errors += 1
        else:
            no_attr_table += 1

        if len(samples) < 3:
            pairs = parse_attrs(desc_m.group(1)) if desc_m else {}
            samples.append(
                {
                    "id": pid.group(1) if pid else None,
                    "name": nm.group(1) if nm else None,
                    "styleUrl": su.group(1) if su else None,
                    "polygon_count": poly_count,
                    "multi_geometry": has_multi,
                    "vertex_sample_count": len(verts),
                    "attribute_keys": list(pairs.keys()),
                    "attributes_sample": {k: pairs.get(k) for k in list(pairs)[:12]},
                }
            )

    unique_ids = len(set(ids))
    fields_summary: dict = {}
    for field, present in attr_field_presence.most_common():
        ctr = attr_value_counts[field]
        fields_summary[field] = {
            "present_in_rows": present,
            "unique_values": len(ctr),
            "empty_value_count": ctr.get("", 0),
            "top_values": [
                {"value": (v if v != "" else "(empty)"), "count": c} for v, c in ctr.most_common(8)
            ],
            "examples": attr_value_examples[field],
        }

    report["geometry"] = {
        "placemarks": placemark_total,
        "geometry_type_counts": dict(geom_types),
        "total_Polygon_tags": report["tag_counts"]["Polygon"],
        "total_MultiGeometry_tags": report["tag_counts"]["MultiGeometry"],
        "total_LinearRing_tags": report["tag_counts"]["LinearRing"],
        "inner_boundary_holes": holes,
        "vertex_count": vertex_count,
        "ring_count_distribution_top": ring_counts.most_common(10),
        "bbox_wgs84": None
        if minx == float("inf")
        else {
            "min_longitude": minx,
            "min_latitude": miny,
            "max_longitude": maxx,
            "max_latitude": maxy,
        },
    }

    report["placemark_properties"] = {
        "with_id": placemark_total - missing_id,
        "missing_id": missing_id,
        "unique_ids": unique_ids,
        "duplicate_ids": (placemark_total - missing_id) - unique_ids,
        "missing_name": missing_name,
        "name_value_counts_top": names.most_common(20),
        "styleUrl_counts": style_urls.most_common(),
    }

    report["attribute_fields"] = fields_summary

    code_fields = [
        f
        for f in fields_summary
        if f
        in {
            "FID",
            "FID_ACCION",
            "ZH",
            "NOMZH",
            "SZH",
            "NOMSZH",
            "UH",
            "NOMUH",
            "OBJECTID_1",
            "FID_ESCENA",
        }
    ]
    report["original_identifiers_observed"] = {
        f: {"unique": fields_summary[f]["unique_values"], "examples": fields_summary[f]["examples"]}
        for f in code_fields
    }

    report["groupings"] = {
        "by_name_top": names.most_common(10),
        "by_styleUrl": style_urls.most_common(),
        "candidate_group_fields_observed": [
            f
            for f in [
                "NOMZH",
                "NOMSZH",
                "NOMUH",
                "Val_Priori",
                "Escenarios",
                "AccionGen",
                "Descripcio",
            ]
            if f in fields_summary
        ],
        "group_field_summaries": {
            f: fields_summary[f]["top_values"]
            for f in ["NOMZH", "NOMSZH", "Val_Priori", "Escenarios", "AccionGen"]
            if f in fields_summary
        },
    }

    report["validity"] = {
        "placemarks_with_empty_or_missing_coordinates": empty_coords,
        "invalid_coordinate_tokens": invalid_coord_tokens,
        "coordinate_blocks_with_fewer_than_4_vertices": small_rings,
        "description_attr_parse_errors": parse_attr_errors,
        "placemarks_without_attribute_table_pairs": no_attr_table,
    }
    report["samples"] = samples
    report["notes"] = [
        "No ExtendedData/SimpleData schemas found; attributes appear embedded as HTML tables inside Placemark description CDATA (ArcGIS-style export).",
        "Folder description refers to prioritization of hydrographic units in Atlántico department; do not assume polygons are individual mangroves.",
        "Only attribute names/values observed in the file are listed; no invented fields.",
        "Attribute numeric fields in HTML use comma decimals; KML coordinates use point decimals.",
    ]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        json.dumps(
            {
                "placemarks": placemark_total,
                "geom_types": dict(geom_types),
                "bbox": report["geometry"]["bbox_wgs84"],
                "empty_coords": empty_coords,
                "invalid_tokens": invalid_coord_tokens,
                "small_rings": small_rings,
                "field_count": len(fields_summary),
                "fields": list(fields_summary.keys()),
                "unique_ids": unique_ids,
                "dup_ids": report["placemark_properties"]["duplicate_ids"],
                "holes": holes,
                "vertices": vertex_count,
                "document": report["document"],
                "folder": report["folders"][0] if report["folders"] else None,
                "report": str(OUT),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
