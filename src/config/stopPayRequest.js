export const STOP_PAY_TEMPLATE_PATH = "assets/templates/stop_pay_template.pdf";

export const STOP_PAY_OUTLOOK_SUBJECT = "Multiple Complete Closing Documents";

export const STOP_PAY_HARDCODED_FIELDS = {
  bank_name: "PlainsCapital Bank",
  account_no: "7720978803",
  requested_by: "Owen Conkey",
  branch_dept: "Austin Mopac"
};

export const STOP_PAY_RECORD_FIELD_MAPPINGS = {
  date_requested: null,
  gf_no: "File #",
  check_no: "Type / Check #",
  amount: "Amount",
  date_check: "Date",
  payable_to: "Payable To"
};

export const STOP_PAY_PDF_FIELD_NAMES = {
  date_check: "dated"
};
