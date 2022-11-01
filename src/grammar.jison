%lex
%%
\s+                   /* skip whitespace */

/* TYPES REGEX */
['].[']                     return "CTE_CHAR"
["].*["]                    return "CTE_STRING"
[+-]?([0-9])+               return "CTE_INT"
[+-]?([0-9]*[.])?[0-9]+f?   return "CTE_FLOAT"

/* ARITHMETIC */
"+"             return "PLUS"
"-"             return "MINUS"
"*"             return "ASTERISK"
"/"             return "SLASH"
"="             return "EQUALS"

/* COMPARISONS */
"<"             return "LT_COMP"
"<="            return "LE_COMP"
">"             return "GT_COMP"
">="            return "GE_COMP"
"!="            return "NE_COMP"
"=="            return "EQ_COMP"
"&&"            return "AND"
"||"            return "OR"
"true"          return "TRUE"
"false"         return "FALSE"

/* SYMBOLS */
"."             return "DOT"
":"             return "COLON"
","             return "COMMA"
";"             return "SEMICOLON"

/* BRACKETS */
"("             return "L_PAREN"
")"             return "R_PAREN"
"{"             return "L_BRACES"
"}"             return "R_BRACES"


"program"       return "PROGRAM"
"main"          return "MAIN"
"if"            return "IF"
"else"          return "ELSE"
"while"         return "WHILE"
"do"            return "DO"
"for"           return "FOR"
"class"         return "CLASS"
"public:"       return "PUBLIC"
"private:"      return "PRIVATE"
"interface"     return "INTERFACE"
"print"         return "PRINT"
"var"           return "VAR"
"const"         return "CONST"
"func"          return "FUNC"
"return"        return "RETURN"


/* TYPES */
"int"           return "INT"
"float"         return "FLOAT"
"char"          return "CHAR"
"string"        return "STRING"
"bool"          return "BOOL"
"void"          return "VOID"


/* ID REGEX */
[A-Z][a-zA-Z]*              return "OBJECT_NAME"
[A-Z][A-Z]*                 return "PROGRAM_NAME"
[a-zA-Z][a-zA-Z0-9]*        return "ID_NAME"
\[[0-9]+\]                  return "ARR_SIZE"
<<EOF>>                     return 'EOF'

/lex
%left 'PLUS' 'MINUS'
%left 'ASTERISK' 'SLASH'

%start program
%%
program 
    : global_def EOF
    ;

main
    : FUNC MAIN L_PAREN params R_PAREN L_BRACES multiple_statutes function_return R_BRACES
    ;

global_def
    : 
    | global_objects_def global_def
    | global_functions_def global_def
    | global_variable_def global_def
    ; 

global_objects_def
    : 
    | object_def global_objects_def 
    | interface_def global_objects_def 
    ;

object_def
    : object_type_def OBJECT_NAME L_BRACES object_public_def R_BRACES SEMICOLON
    | object_type_def OBJECT_NAME L_BRACES object_public_def object_private_def R_BRACES SEMICOLON
    ;

object_type_def
    : CLASS
    | INTERFACE
    ;

object_public_def
    : PUBLIC object_attribute_def
    ;
object_private_def
    : PRIVATE object_attribute_def
    ;

object_attribute_def
    : 
    | variable_def object_attribute_def
    | function_def object_attribute_def
    ;

global_variable_def
    : variable_def
    | global_variable_def variable_def
    ;

object_attribute_call
    : ID_NAME object_attribute_call_prime
    ;

object_attribute_call_prime
    :
    | DOT id_call object_attribute_call_prime
    ;

variable_def
    : VAR var_def var_multiple_def SEMICOLON
    | CONST VAR var_def var_multiple_def SEMICOLON
    ;

var_multiple_def
    :
    | COMMA var_def var_multiple_def
    ;

var_def
    : ID_NAME COLON type var_expression
    ;

var_expression
    :
    | EQUALS expression
    ;

type
    : CHAR
    | STRING
    | INT
    | FLOAT
    | BOOL
    ;

global_functions_def
    : main
    | main multiple_functions_def
    | multiple_functions_def main
    ;

multiple_functions_def
    : function_def
    | multiple_functions_def function_def
    ;

function_def
    : FUNC ID_NAME L_PAREN params R_PAREN COLON function_type L_BRACES multiple_statutes R_BRACES
    ;

function_type
    : type
    | VOID
    ;

params
    : /* empty */
    | ID_NAME COLON type
    | ID_NAME COLON type COMMA params
    ;

multiple_statutes
    : statute
    | multiple_statutes statute
    ;

statute
    : variable_def
    | variable_assign
    | decision_statute
    | do_while_loop
    | while_loop
    | function_return
    | function_call
    | object_attribute_call SEMICOLON
    ;

function_call
    : ID_NAME L_PAREN call_params R_PAREN SEMICOLON
    ;

do_while_loop
    : DO L_BRACES multiple_statutes R_BRACES WHILE L_PAREN expression R_PAREN SEMICOLON
    ;

while_loop
    : WHILE L_PAREN expression R_PAREN L_BRACES multiple_statutes R_BRACES
    ;

decision_statute
    : IF L_PAREN expression R_PAREN L_BRACES multiple_statutes R_BRACES
    | IF L_PAREN expression R_PAREN L_BRACES multiple_statutes R_BRACES ELSE L_BRACES multiple_statutes R_BRACES
    | IF L_PAREN expression R_PAREN L_BRACES multiple_statutes R_BRACES ELSE decision_statute
    ;

variable_assign
    : ID_NAME EQUALS expression SEMICOLON
    ;

function_return
    : RETURN expression SEMICOLON
    | RETURN SEMICOLON
    ;

expression
    : comp boolean_comp
    ;

boolean_comp
    :
    | AND comp boolean_comp
    | OR comp boolean_comp
    ;

comp
    : exp comp_prime
    ;

comp_prime
    : 
    | comp_operators exp
    ;

exp
    : term exp_prime
    ;

exp_prime
    : /* empty */
    | PLUS term exp_prime
    | MINUS term exp_prime
    ;

term
    : fact term_prime
    ;

term_prime
    : /* empty */
    | ASTERISK fact term_prime
    | SLASH fact term_prime
    ;

fact
    // : expression
    : CTE_INT
    | L_PAREN expression R_PAREN 
    | CTE_FLOAT
    | CTE_STRING
    | CTE_CHAR
    | TRUE
    | FALSE
    | id_call
    | object_attribute_call
    ;

id_call
    : ID_NAME
    | ID_NAME L_PAREN call_params R_PAREN
    | ID_NAME ARR_SIZE
    | ID_NAME ARR_SIZE ARR_SIZE
    ;

call_params
    :
    | expression
    | expression COMMA call_params
    ;

comp_operators
    : EQ_COMP
    | GE_COMP
    | GT_COMP
    | LE_COMP
    | LT_COMP
    | NE_COMP
    ;