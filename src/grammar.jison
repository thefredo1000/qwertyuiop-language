%lex
%%
\s+                   /* skip whitespace */

/* TYPES REGEX */
['].[']                     return "CTE_CHAR"
["][^".]*["]                    return "CTE_STRING"
[+-]?([0-9])+[.]([0-9])+    return "CTE_FLOAT"
[+-]?([0-9])+               return "CTE_INT"

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
"undefined"     return "UNDEFINED"


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
    : program_name global_def EOF {
        yy.data.semantics.closeFunction();
    }
    ;

program_name
    :
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
    : VAR var_def SEMICOLON {
        yy.data.semantics.saveVariable($2.name, $2.type, $2.expression, false);
        yy.data.semantics.storeData($2.name);
    }
    | CONST VAR var_def SEMICOLON {
        yy.data.semantics.saveVariable($3.name, $3.type, $3.expression, true);
        yy.data.semantics.storeData($3.name);
    }
    ;

var_def
    : ID_NAME COLON type EQUALS expression_0 {
        $$ = {name : $1, type : $3, expression : $5, isConst : undefined}
    }
    |  ID_NAME COLON type {
        $$ = {name : $1, type : $3, expression : undefined, isConst : undefined}
    }
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
    : function_prime L_BRACES multiple_statutes R_BRACES {
        yy.data.semantics.closeFunction();
    }
    ;

function_prime 
    : FUNC ID_NAME L_PAREN params R_PAREN COLON function_type {
        yy.data.semantics.saveFunction($2, $7);
    } 
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
    : DO L_BRACES multiple_statutes R_BRACES WHILE L_PAREN expression_0 R_PAREN SEMICOLON
    ;

while_loop
    : WHILE L_PAREN expression_0 R_PAREN L_BRACES multiple_statutes R_BRACES
    ;

decision_statute
    : IF L_PAREN expression_0 R_PAREN L_BRACES multiple_statutes R_BRACES
    | IF L_PAREN expression_0 R_PAREN L_BRACES multiple_statutes R_BRACES ELSE L_BRACES multiple_statutes R_BRACES
    | IF L_PAREN expression_0 R_PAREN L_BRACES multiple_statutes R_BRACES ELSE decision_statute
    ;

variable_assign
    : ID_NAME EQUALS expression_0 SEMICOLON {
        yy.data.semantics.storeData($1);
    }
    ;

function_return
    : RETURN expression_0 SEMICOLON {
        // TODO: check if the return type is the same as the function type
        yy.data.semantics.removeOperand();
    }
    | RETURN SEMICOLON
    ;

expression_0
    : expression_1 boolean_comp
    ;

boolean_comp
    :
    | AND expression_1 boolean_comp
    | OR expression_1 boolean_comp
    ;

expression_1
    : expression_2 expression_1_prime  
    ;

expression_1_prime
    : 
    | comp_operators expression_2
    ;

expression_2
    : expression_3_pre expression_2_prime 
    ;

expression_3_pre 
    : expression_3 {
        yy.data.semantics.processExpression(["+", "-"]); 
    }
    ;

expression_2_prime
    : /* empty */ 
    | sub_add_operators expression_3_pre expression_2_prime 
    ;

sub_add_operators
    : PLUS {
        yy.data.semantics.storeOperator($1)
    }
    | MINUS {
        yy.data.semantics.storeOperator($1)
    }
    ;

expression_3
    : expression_4_pre expression_3_prime
    ;

expression_4_pre
    : expression_4 {
        yy.data.semantics.processExpression(["*", "/"]); 
    }
    ;

expression_3_prime
    : /* empty */ 
    | mult_div_operand expression_4_pre expression_3_prime 
    ;

mult_div_operand
    : ASTERISK {
        yy.data.semantics.storeOperator($1)
    }
    | SLASH {
        yy.data.semantics.storeOperator($1)
    }
    ;

expression_4
    : CTE_FLOAT {
        yy.data.semantics.storeOperand($1, "float");
    }
    | L_PAREN expression R_PAREN 
    | CTE_INT {
        yy.data.semantics.storeOperand($1, "int");
    }
    | CTE_STRING{
        console.log($1)
        yy.data.semantics.storeOperand($1, "string");
    }
    | CTE_CHAR {
        yy.data.semantics.storeOperand($1, "char");
    }
    | TRUE {
        yy.data.semantics.storeOperand("1", "bool");
    }
    | FALSE {
        yy.data.semantics.storeOperand("0", "bool");
    }
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
    | expression_0 call_params_prime
    ;

call_params_prime
    :
    | COMMA call_params_prime
    ;

comp_operators
    : EQ_COMP
    | GE_COMP
    | GT_COMP
    | LE_COMP
    | LT_COMP
    | NE_COMP
    ;