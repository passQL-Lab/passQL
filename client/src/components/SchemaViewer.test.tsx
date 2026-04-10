import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SchemaViewer, parseSchemaDisplay, parseSampleData } from "./SchemaViewer";

const schemaDisplay = "CUSTOMER (id INT PK, name VARCHAR, email VARCHAR)\nORDERS (id INT PK, customer_id INT FK, amount INT, order_date DATE)";
const schemaSampleData = "INSERT INTO CUSTOMER VALUES (1, '홍길동', 'hong@test.com');\nINSERT INTO CUSTOMER VALUES (2, '김영희', 'kim@test.com');\nINSERT INTO ORDERS VALUES (1, 1, 50000, '2026-01-01');";
const schemaDdl = "CREATE TABLE CUSTOMER (id INT PRIMARY KEY);";

describe("parseSchemaDisplay", () => {
  it("테이블명과 컬럼 파싱", () => {
    const result = parseSchemaDisplay(schemaDisplay);
    expect(result).toHaveLength(2);
    expect(result[0].tableName).toBe("CUSTOMER");
    expect(result[0].columns).toHaveLength(3);
    expect(result[0].columns[0]).toEqual({ name: "id", type: "INT", constraint: "PK" });
    expect(result[0].columns[1]).toEqual({ name: "name", type: "VARCHAR", constraint: null });
  });

  it("FK 컬럼 파싱", () => {
    const result = parseSchemaDisplay(schemaDisplay);
    const fkCol = result[1].columns.find((c) => c.name === "customer_id");
    expect(fkCol?.constraint).toBe("FK");
  });

  it("빈 문자열 → 빈 배열", () => {
    expect(parseSchemaDisplay("")).toEqual([]);
  });
});

describe("parseSampleData", () => {
  it("INSERT문을 테이블별 행으로 파싱", () => {
    const result = parseSampleData(schemaSampleData);
    expect(result.get("CUSTOMER")).toHaveLength(2);
    expect(result.get("ORDERS")).toHaveLength(1);
  });

  it("CUSTOMER 첫 행 값 파싱", () => {
    const result = parseSampleData(schemaSampleData);
    expect(result.get("CUSTOMER")![0]).toEqual(["1", "홍길동", "hong@test.com"]);
  });
});

describe("SchemaViewer", () => {
  it("테이블 카드 헤더 렌더링", () => {
    render(<SchemaViewer schemaDisplay={schemaDisplay} />);
    expect(screen.getByText("CUSTOMER")).toBeInTheDocument();
    expect(screen.getByText("ORDERS")).toBeInTheDocument();
  });

  it("컬럼 타입 렌더링", () => {
    render(<SchemaViewer schemaDisplay={schemaDisplay} />);
    expect(screen.getAllByText("INT").length).toBeGreaterThan(0);
    expect(screen.getAllByText("VARCHAR").length).toBeGreaterThan(0);
  });

  it("DDL 접기 토글 동작", () => {
    render(<SchemaViewer schemaDisplay={schemaDisplay} schemaDdl={schemaDdl} />);
    expect(screen.queryByText(schemaDdl)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("DDL 보기"));
    expect(screen.getByText(schemaDdl)).toBeInTheDocument();
  });

  it("샘플 데이터 테이블 렌더링", () => {
    render(<SchemaViewer schemaDisplay={schemaDisplay} schemaSampleData={schemaSampleData} />);
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("hong@test.com")).toBeInTheDocument();
  });
});
