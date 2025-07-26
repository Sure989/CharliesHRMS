// Utility/context exports from form.tsx for Fast Refresh compliance
import * as React from "react";

const FormFieldContext = React.createContext({} as any);
const FormItemContext = React.createContext({} as any);

export { FormFieldContext, FormItemContext };
