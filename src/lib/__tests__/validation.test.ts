import { describe, it, expect } from "vitest";
import { isCPF, isCNPJ, isCpfOrCnpj, isEmail, isBrazilPhone } from "../validators";
import { ClientSchema, CenterSchema, OrderSchema } from "../validation";

describe("validators", () => {
  it("validates email", () => {
    expect(isEmail("test@example.com")).toBe(true);
    expect(isEmail("invalid")).toBe(false);
  });

  it("validates cpf/cnpj", () => {
    // Known valid CPF and CNPJ examples
    expect(isCPF("529.982.247-25")).toBe(true);
    expect(isCNPJ("04.252.011/0001-10")).toBe(true);
    expect(isCpfOrCnpj("52998224725")).toBe(true);
    expect(isCpfOrCnpj("04252011000110")).toBe(true);
    expect(isCpfOrCnpj("123")).toBe(false);
  });

  it("validates brazil phone (permissive)", () => {
    expect(isBrazilPhone("11987654321")).toBe(true);
    expect(isBrazilPhone("(11) 98765-4321")).toBe(true);
    expect(isBrazilPhone("98765")).toBe(false);
  });
});

describe("zod schemas", () => {
  it("ClientSchema happy path", () => {
    const result = ClientSchema.safeParse({
      name: "Cliente X",
      cnpjCpf: "529.982.247-25",
      phone: "(11) 98765-4321",
      email: "cliente@example.com",
      address: "Av. Brasil, 100",
    });
    expect(result.success).toBe(true);
  });

  it("CenterSchema happy path", () => {
    const result = CenterSchema.safeParse({ name: "Centro A", type: "Interno", obs: "" });
    expect(result.success).toBe(true);
  });

  it("OrderSchema happy path", () => {
    const result = OrderSchema.safeParse({
      clientId: 1,
      centerId: 1,
      title: "Livro A",
      tiragem: 1000,
      formato: "A4",
      numPaginasTotal: 120,
      numPaginasColoridas: 32,
      valorUnitario: 10.5,
      valorTotal: 10500,
      prazoEntrega: "2025-10-01",
      obs: "",
    });
    expect(result.success).toBe(true);
  });
});

