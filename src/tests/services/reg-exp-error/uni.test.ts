import { RegExpError } from "@services/reg-exp-error";

describe("Services - Regular Expression Error", () => {
  const regularLetters = "letters";
  const accentedLetters = "accented";
  const someSpecialLetters = "these special";
  const allSpecialLetters = "special";
  const numbers = "numbers";

  it("Should create regular expression with regular, accented, all special characters, and numbers", () => {
    const regExp = new RegExpError(true, true, true, true);

    expect(regExp.label.includes(regularLetters)).toBe(true);
    expect(regExp.label.includes(accentedLetters)).toBe(true);
    expect(regExp.label.includes(allSpecialLetters)).toBe(true);
    expect(regExp.label.includes(numbers)).toBe(true);
  });

  it("Should create regular expression with regular, accented, some special characters, and numbers", () => {
    const regExp = new RegExpError(true, true, ["è,é"], true);

    expect(regExp.label.includes(regularLetters)).toBe(true);
    expect(regExp.label.includes(accentedLetters)).toBe(true);
    expect(regExp.label.includes(someSpecialLetters)).toBe(true);
    expect(regExp.label.includes(numbers)).toBe(true);
  });

  it("Should create regular expression with regular, accented, and special characters with no numbers", () => {
    const regExp = new RegExpError(true, true, true, false);

    expect(regExp.label.includes(regularLetters)).toBe(true);
    expect(regExp.label.includes(accentedLetters)).toBe(true);
    expect(regExp.label.includes(allSpecialLetters)).toBe(true);
    expect(regExp.label.includes(numbers)).toBe(false);
  });

  it("Should create regular expression with regular and accented characters, with numbers, and no special characters", () => {
    const regExp = new RegExpError(true, true, false, true);

    expect(regExp.label.includes(regularLetters)).toBe(true);
    expect(regExp.label.includes(accentedLetters)).toBe(true);
    expect(regExp.label.includes(allSpecialLetters)).toBe(false);
    expect(regExp.label.includes(numbers)).toBe(true);
  });

  it("Should create regular expression with regular and special characters, with numbers, and no accented characters", () => {
    const regExp = new RegExpError(true, false, true, true);

    expect(regExp.label.includes(regularLetters)).toBe(true);
    expect(regExp.label.includes(accentedLetters)).toBe(false);
    expect(regExp.label.includes(allSpecialLetters)).toBe(true);
    expect(regExp.label.includes(numbers)).toBe(true);
  });

  it("Should create regular expression with accented and special characters, with numbers, and no regular characters", () => {
    const regExp = new RegExpError(false, true, true, true);

    expect(regExp.label.includes(regularLetters)).toBe(false);
    expect(regExp.label.includes(accentedLetters)).toBe(true);
    expect(regExp.label.includes(allSpecialLetters)).toBe(true);
    expect(regExp.label.includes(numbers)).toBe(true);
  });

  it("Should have a minimum and a maximum number of the same value", () => {
    const regExp = new RegExpError(true, true, true, true, 24, 24);

    expect(regExp.label.includes("24 characters")).toBe(true);
  });

  it("Should have a minimum number of 10 characters and a maximum of 20", () => {
    const regExp = new RegExpError(true, true, true, true, 10, 20);

    expect(regExp.label.includes("10-20 characters")).toBe(true);
  });

  it("Should have a minimum number of 15 characters", () => {
    const regExp = new RegExpError(true, true, true, true, 15);

    expect(regExp.label.includes("minimum of 15")).toBe(true);
  });

  it("Should have a maximum number of 20 characters", () => {
    const regExp = new RegExpError(true, true, true, true, null, 20);

    expect(regExp.label.includes("maximum of 20")).toBe(true);
  });

  it("Should start with a custom label", () => {
    const customLabel = "I'm a custom label";
    const regExp = new RegExpError(
      true,
      true,
      true,
      true,
      null,
      null,
      customLabel
    );

    expect(regExp.label.includes(customLabel, 0)).toBe(true);
  });
});
