export class RegExpError {
  // Allows regular letters
  private regularLetters: boolean;

  // Allows for accented characters
  private accentedCharacters: boolean;

  // Allows for special characters
  private specialCharacters: boolean | string[];

  // Allows for numbers
  private numbers: boolean;

  // The minimum amount of characters
  private minimum: number;

  // The maximum amount of characters
  private maximum: number;

  // Custom error label
  private customLabel: string;

  constructor(
    hasRegularLetters: boolean,
    hasAccentedCharacters: boolean,
    hasSpecialCharacters: boolean | string[],
    hasNumbers: boolean,
    minLength?: number,
    maxLength?: number,
    customLabel?: string
  ) {
    this.regularLetters = hasRegularLetters;
    this.accentedCharacters = hasAccentedCharacters;
    this.specialCharacters = hasSpecialCharacters;
    this.numbers = hasNumbers;
    this.minimum = minLength ? minLength : 0;
    this.maximum = maxLength ? maxLength : 0;
    this.customLabel = customLabel ? customLabel : "";
  }

  get label(): string {
    let label = "";

    if (this.customLabel) {
      label += this.customLabel.toLowerCase() + ", ";
    }

    label += "only";

    if (this.regularLetters) {
      label += " " + "letters,";
    }

    if (this.accentedCharacters) {
      label += " " + "accented characters,";
    }

    if (this.specialCharacters) {
      if (Array.isArray(this.specialCharacters)) {
        label +=
          " " +
          `these special characters [${this.specialCharacters.join(" ")}],`;
      } else {
        label += " " + "special characters,";
      }
    }

    if (this.numbers) {
      label += " " + "numbers,";
    }

    if (this.minimum && this.maximum) {
      if (this.minimum === this.maximum) {
        label += " " + `${this.minimum} characters.`;
      } else {
        label += " " + `${this.minimum}-${this.maximum} characters.`;
      }
    }

    // Puts the label in titlecase form
    label = label.slice(0, 1).toUpperCase() + label.slice(1).toLowerCase();

    return label;
  }
}
