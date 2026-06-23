"""
Script chuyển đổi file "MCQ Thực vật dược liệu tn.doc" sang định dạng JSON.
Định dạng file nguồn (giống Dược.doc):
- Dòng bắt đầu bằng số + '. ' → câu hỏi (một số câu hỏi có phần mô tả ở dòng kế tiếp
  trước khi đến các đáp án)
- Dòng bắt đầu bằng '= ' → đáp án đúng
- Dòng bắt đầu bằng '~ ' → lựa chọn sai
"""

import olefile
import json
import re
import os
import sys

INPUT_FILE = "MCQ Thực vật dược liệu tn.doc"
OUTPUT_FILE = "data/questions_thucvat_duoclieu.json"
START_ID = 1  # ID bắt đầu cho câu hỏi đầu tiên


def extract_text_from_doc(filepath: str) -> list[str]:
    """Đọc file .doc (Word 97-2003 OLE) và trả về danh sách các dòng text."""
    ole = olefile.OleFileIO(filepath)
    word_data = ole.openstream("WordDocument").read()
    ole.close()

    text = word_data.decode("utf-16-le", errors="replace")
    lines = text.replace("\r", "\n").split("\n")
    cleaned = []
    for line in lines:
        clean = "".join(c for c in line if c.isprintable() or c == " ")
        clean = clean.strip()
        if clean:
            cleaned.append(clean)
    return cleaned


def parse_questions(lines: list[str]) -> list[dict]:
    """Parse danh sách dòng thành danh sách câu hỏi theo schema chuẩn."""
    questions = []
    option_labels = ["A", "B", "C", "D"]  # chi xuat toi da 4 lua chon

    current_question = None
    current_options = []  # list of (text, is_correct)

    question_pattern = re.compile(r"^\d+\.\s+(.+)$")
    # Tiêu đề như "BỘ CÂU HỎI THI KẾT THÚC MÔN HỌC/MÔ ĐUN" xuất hiện
    # trước câu 1 - các dòng này được bỏ qua vì không khớp pattern.

    def save_current():
        nonlocal current_question, current_options
        if current_question is None:
            return

        if len(current_options) < 2:
            print(f"  [CANH BAO] Cau hoi '{current_question[:50]}...' co it hon 2 lua chon, bo qua.")
            current_question = None
            current_options = []
            return

        correct_idx = None
        for i, (_, is_correct) in enumerate(current_options):
            if is_correct:
                correct_idx = i
                break

        if correct_idx is None:
            print(f"  [CANH BAO] Cau hoi '{current_question[:50]}...' khong co dap an dung (=), bo qua.")
            current_question = None
            current_options = []
            return

        options = {}
        # Chi giu toi da 4 lua chon (schema A-D cua app). Neu co nhieu hon,
        # uu tien giu dap an dung va chon 3 lua chon sai theo thu tu xuat hien.
        if len(current_options) > 4:
            correct_opt = next(((t, c) for t, c in current_options if c), None)
            wrong_opts = [opt for opt in current_options if not opt[1]][:3]
            if correct_opt is not None:
                kept_options = wrong_opts + [correct_opt]
            else:
                kept_options = current_options[:4]
        else:
            kept_options = current_options

        correct_idx_kept = None
        for i, (_, is_correct) in enumerate(kept_options):
            if is_correct:
                correct_idx_kept = i
                break

        for i, (text, _) in enumerate(kept_options):
            options[option_labels[i]] = text

        answer = option_labels[correct_idx_kept]

        questions.append({
            "question": current_question,
            "options": options,
            "answer": answer,
        })

        current_question = None
        current_options = []

    for line in lines:
        m = question_pattern.match(line)
        if m:
            save_current()
            current_question = m.group(1).strip()
            continue

        if line.startswith("= "):
            if current_question is not None:
                current_options.append((line[2:].strip(), True))
            continue

        if line.startswith("~ "):
            if current_question is not None:
                current_options.append((line[2:].strip().lstrip('.').strip(), False))
            continue

        # Một số câu hỏi có phần mô tả trên dòng tiếp theo trước các đáp án
        # (ví dụ "1. Lựa chọn..." → "Nhận biết đúng cây thuốc...").
        # Gộp dòng đó vào nội dung câu hỏi CHỈ khi chưa có lựa chọn nào
        # và dòng tiếp theo KHÔNG có dạng lựa chọn (không bắt đầu bằng
        # "~" hoặc "="). Nếu lỡ có dòng "~.Diệt các loại giun" thì ta vẫn
        # muốn coi nó là lựa chọn sai, không phải mô tả.
        if current_question is not None and not current_options:
            stripped = line.lstrip()
            if stripped.startswith("~") or stripped.startswith("="):
                # Rơi vào nhánh xử lý lựa chọn bên dưới.
                pass
            else:
                current_question = f"{current_question} {line.strip()}"
                continue

        # Một số dòng lựa chọn bị lệch dấu, ví dụ "~.Diệt các loại giun"
        # hoặc "~Glycoisd tim" (không có dấu cách). Xử lý khi đang chờ
        # lựa chọn cho câu hiện tại.
        if current_question is not None:
            stripped = line.lstrip()
            if stripped.startswith("~"):
                text = stripped.lstrip("~").lstrip(".").strip()
                if text:
                    # Giới hạn tối đa 4 lựa chọn sai để khớp schema A-D.
                    # Nếu dòng rơi vào đây mà đã đủ 4 phương án thì có thể
                    # đây là lựa chọn sót của câu trước - bỏ qua.
                    wrong_count = sum(1 for _, is_correct in current_options if not is_correct)
                    if wrong_count < 3:
                        current_options.append((text, False))
                continue
            if stripped.startswith("="):
                text = stripped.lstrip("=").strip()
                if text and not any(is_correct for _, is_correct in current_options):
                    current_options.append((text, True))
                continue

    save_current()
    return questions


def assign_ids(questions: list[dict], start_id: int) -> list[dict]:
    for i, q in enumerate(questions):
        q["id"] = start_id + i
    return questions


def main():
    print("=" * 60)
    print("  Chuyen doi MCQ Thuc vat duoc lieu tn.doc -> JSON")
    print("=" * 60)

    if not os.path.exists(INPUT_FILE):
        print(f"Khong tim thay file: {INPUT_FILE}")
        sys.exit(1)
    print(f"\nTim thay file: {INPUT_FILE}")

    print("\nDang doc file .doc...")
    lines = extract_text_from_doc(INPUT_FILE)
    print(f"  -> Trich xuat duoc {len(lines)} dong text")

    print("\nDang phan tich cau hoi...")
    new_questions = parse_questions(lines)
    print(f"  -> Tim duoc {len(new_questions)} cau hoi hop le")

    if not new_questions:
        print("Khong tim duoc cau hoi nao. Kiem tra lai file dau vao.")
        sys.exit(1)

    new_questions = assign_ids(new_questions, START_ID)

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(new_questions, f, ensure_ascii=False, indent=2)

    print(f"\nDa ghi {len(new_questions)} cau hoi vao: {OUTPUT_FILE}")

    print("\n--- Mau 3 cau dau ---")
    for q in new_questions[:3]:
        print(f"\n  ID {q['id']}: {q['question'][:80]}...")
        for key, val in q["options"].items():
            marker = "DUNG" if key == q["answer"] else "    "
            print(f"  {marker} {key}. {val[:60]}")

    print("\n--- Mau 3 cau cuoi ---")
    for q in new_questions[-3:]:
        print(f"\n  ID {q['id']}: {q['question'][:80]}...")
        for key, val in q["options"].items():
            marker = "DUNG" if key == q["answer"] else "    "
            print(f"  {marker} {key}. {val[:60]}")

    print("\n" + "=" * 60)
    print("  Hoan thanh!")
    print("=" * 60)


if __name__ == "__main__":
    main()
