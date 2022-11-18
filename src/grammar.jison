%lex
%%
\s+                   /* skip whitespace */

/* TYPES REGEX */
['].[']                     return "CTE_CHAR"
["][^".]*["]                    return "CTE_STRING"
[+-]?([0-9])+[.]([0-9])+    return "CTE_FLOAT"
"PI"                        return "CTE_PI"
[+-]?([0-9])+               return "CTE_INT"


/* COMPARISONS */
">="            return "GE_COMP"
"<="            return "LE_COMP"
"<"             return "LT_COMP"
">"             return "GT_COMP"
"!="            return "NE_COMP"
"=="            return "EQ_COMP"
"&&"            return "AND"
"||"            return "OR"
"true"          return "TRUE"
"false"         return "FALSE"

/* ARITHMETIC */
"+"             return "PLUS"
"-"             return "MINUS"
"*"             return "ASTERISK"
"/"             return "SLASH"
"="             return "EQUALS"

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
"["             return "L_BRACKET"
"]"             return "R_BRACKET"


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
"sum"           return "SUM"
"sin"           return "SIN"
"cos"           return "COS"
"tan"           return "TAN"
"min"           return "MIN"
"max"           return "MAX"
"product"       return "PRODUCT"
"mean"          return "MEAN"
"mode"          return "MODE"
"median"        return "MEDIAN"
"chart"         return "CHART"


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
// \[[0-9]+\]                  return "ARR_SIZE"
<<EOF>>                     return 'EOF'

/lex
%left 'PLUS' 'MINUS'
%left 'ASTERISK' 'SLASH'

%start program
%%
program 
    : program_name global_def EOF {
        yy.data.semantics.closeFunction();
        yy.data.semantics.closeProgram();
    }
    ;

program_name
    : {
    }
    ;

global_def
    : global_objects_def global_variable_def global_functions_def
    ; 

global_objects_def
    : 
    | object_def global_objects_def 
    | interface_def global_objects_def 
    ;

object_def
    : object_type_def L_BRACES object_public_def R_BRACES SEMICOLON
    | object_type_def L_BRACES object_public_def object_private_def R_BRACES SEMICOLON
    ;

object_type_def
    : CLASS OBJECT_NAME {
        yy.data.semantics.openClass($2);
    }
    ;

object_public_def
    : PUBLIC object_attribute_def
    ;
object_private_def
    : PRIVATE object_attribute_def
    ;

object_attribute_def
    : 
    | object_variable_def object_attribute_def
    | function_def object_attribute_def
    ;

object_variable_def
    : VAR var_def SEMICOLON {
        if ($2.isArray) {
            yy.data.semantics.saveArray($2.name, $2.type, $2.expression, false);
            yy.data.semantics.storeData($2.name);
        } else {
            yy.data.semantics.saveVariable($2.name, $2.type, $2.expression, false);
            yy.data.semantics.storeData($2.name);
        }
    }
    | CONST VAR var_def SEMICOLON {
        if ($2.isArray) {
            yy.data.semantics.saveVariable($3.name, $3.type, $3.expression, true);
            yy.data.semantics.storeData($3.name);
        } else {
            yy.data.semantics.saveVariable($3.name, $3.type, $3.expression, true);
            yy.data.semantics.storeData($3.name);
        }
    }
    ;

global_variable_def
    : {
        yy.data.semantics.openProgram();
    }
    | variable_def global_variable_def 
    ;

object_attribute_call
    : id_call object_attribute_call_prime
    ;

object_attribute_call_prime
    : DOT id_call object_attribute_call 
    ;

variable_def
    : VAR var_def SEMICOLON {
        if ($2.isArray) {
            yy.data.semantics.saveArray($2.name, $2.type, $2.expression, false);
            yy.data.semantics.storeData($2.name);
        } else {
            yy.data.semantics.saveVariable($2.name, $2.type, $2.expression, false);
            yy.data.semantics.storeData($2.name);
        }
    }
    | CONST VAR var_def SEMICOLON {
        if ($2.isArray) {
            yy.data.semantics.saveVariable($3.name, $3.type, $3.expression, true);
            yy.data.semantics.storeData($3.name);
        } else {
            yy.data.semantics.saveVariable($3.name, $3.type, $3.expression, true);
            yy.data.semantics.storeData($3.name);
        }
    }
    ;

var_def
    : ID_NAME COLON type array_size EQUALS expression_0 {
        $$ = {name : $1, type : $3, expression : $6, isConst : undefined, isArray: $4};
    }
    |  ID_NAME COLON type array_size {
        $$ = {name : $1, type : $3, expression : undefined, isConst : undefined, isArray: $4}
    }
    ;

type
    : CHAR
    | STRING
    | INT
    | FLOAT
    | BOOL
    ;

array_size
    : {
        $$ = false;
    }
    | array_size_prime array_size {
        $$ = true
    }
    ;

array_size_prime 
    :  L_BRACKET CTE_INT R_BRACKET {
        yy.data.semantics.saveArraySize($2);
    }
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

main
    : main_prime multiple_statutes function_return R_BRACES {
        yy.data.semantics.closeFunction();
    }
    ;

main_prime
    : main_pre L_PAREN params R_PAREN L_BRACES {
        yy.data.semantics.setFunctionType($1, "void");
    } 
    ;

main_pre 
    : FUNC MAIN {
        yy.data.semantics.saveFunction($2);
        yy.data.semantics.setInitialGoto();
        $$ = $2;
    }
    ;

function_def
    : function_prime L_BRACES multiple_statutes R_BRACES {
        yy.data.semantics.closeFunction();
    }
    ;

function_prime 
    : function_pre L_PAREN params R_PAREN COLON function_type {
        yy.data.semantics.setFunctionType($1, $6);
    } 
    ;
function_pre 
    : FUNC ID_NAME {
        yy.data.semantics.saveFunction($2);
        $$ = $2;
    }
    ;

function_type
    : type 
    | VOID
    ;

params
    : /* empty */
    | param 
    | param COMMA params
    ;

param 
    : ID_NAME COLON type {
        yy.data.semantics.saveVariable($1,  $3, undefined, false);
        yy.data.semantics.saveParam($1, $3);
    }
    ;

multiple_statutes
    : statute
    | multiple_statutes statute
    ;

statute
    : variable_def
    | variable_assign
    | array_assign
    | decision_statute
    | do_while_loop
    | while_loop
    | for_loop
    | function_return
    | function_call
    // | object_attribute_call SEMICOLON
    | other_functions
    ;

other_functions
    : print
    | sum SEMICOLON
    | chart SEMICOLON
    ;

sum 
    : SUM L_PAREN expression_0 R_PAREN   {
        yy.data.semantics.processSum();
    }
    ;

sin 
    : SIN L_PAREN expression_0 R_PAREN   {
        yy.data.semantics.processSin();
    }
    ;

cos 
    : COS L_PAREN expression_0 R_PAREN   {
        yy.data.semantics.processCos();
    }
    ;

tan 
    : TAN L_PAREN expression_0 R_PAREN   {
        yy.data.semantics.processTan();
    }
    ;

chart
    : CHART L_PAREN expression_0 R_PAREN {
        yy.data.semantics.processChart();
    }
    ;

print
    : PRINT L_PAREN expression_0 R_PAREN SEMICOLON {
        yy.data.semantics.processPrint();
    }
    ;


function_call
    : pre_call_function call_params R_PAREN SEMICOLON {
        yy.data.semantics.callFunction($1);
    }
    ;


do_while_loop
    : DO L_BRACES multiple_statutes R_BRACES WHILE L_PAREN expression_0 R_PAREN SEMICOLON
    ;


for_loop
    : FOR L_PAREN for_loop_pre for_loop_expression SEMICOLON ID_NAME EQUALS expression_0 SEMICOLON R_PAREN L_BRACES multiple_statutes R_BRACES  {
        yy.data.semantics.storeData($8);
        yy.data.semantics.closeForLoop();
    }
    ;

for_loop_pre 
    :  variable_def {
        yy.data.semantics.saveWhileLoop();
    }
    ;

for_loop_expression
    : expression_0 {
        yy.data.semantics.processForLoop();
    }
    ;

while_loop
    : while_loop_pre while_loop_expression L_BRACES multiple_statutes R_BRACES {
        yy.data.semantics.closeWhileLoop();
    }
    ;

while_loop_pre 
    : WHILE {
        yy.data.semantics.saveWhileLoop();
    }
    ;

while_loop_expression
    : L_PAREN expression_0 R_PAREN {
        yy.data.semantics.processWhileLoopExpression($1);
    }
    ;

decision_statute
    : IF decision_statute_expression L_BRACES multiple_statutes R_BRACES {
        yy.data.semantics.endDecisionStat();
    }
    | IF decision_statute_expression L_BRACES multiple_statutes R_BRACES decision_statue_else L_BRACES multiple_statutes R_BRACES{
        yy.data.semantics.endDecisionStat();
    }
    | IF decision_statute_expression L_BRACES multiple_statutes R_BRACES decision_statue_else decision_statute{
        yy.data.semantics.endDecisionStat();
    }
    ;

decision_statute_expression
    : L_PAREN expression_0 R_PAREN {
        yy.data.semantics.processDecisionStatExpression()
    }
    ;

decision_statue_else
    : ELSE {
        yy.data.semantics.processDecisionStatElse();
    }
    ;

variable_assign
    : ID_NAME EQUALS expression_0 SEMICOLON {
        yy.data.semantics.storeData($1);
    }
    ;

array_assign
    : array_call EQUALS expression_0 SEMICOLON {
        yy.data.semantics.storeArrayInStack();
    }
    ;


function_return
    : RETURN expression_0 SEMICOLON {
        // TODO: check if the return type is the same as the function type
        yy.data.semantics.returnFunction();
    }
    | RETURN SEMICOLON{
        // TODO: check if the return type is the same as the function type
        yy.data.semantics.returnFunction();
    }
    ;

expression_0
    : expression_0_or_pre expression_0_prime
    ;

expression_0_prime 
    : 
    | and expression_0_or_pre expression_0_prime
    ;

and    
    : AND {
        yy.data.semantics.storeOperator($1)
    }
    ;

expression_0_or_pre
    : expression_0_or {
        yy.data.semantics.processExpression(["&&"]);
    }
    ;

expression_0_or
    : expression_1_pre expression_0_or_prime
    ;

expression_0_or_prime 
    : 
    | or expression_1_pre expression_0_or_prime
    ;

or
    : OR {
        yy.data.semantics.storeOperator($1)
    }
    ;

expression_1_pre
    : expression_1 {
        yy.data.semantics.processExpression(["||"]);
    }
    ;

expression_1
    : expression_2_pre expression_1_prime  
    ;

expression_2_pre
    : expression_2 {
        yy.data.semantics.processExpression([">", "<", ">=", "<=", "==", "!="]);
    }
    ;
expression_1_prime
    : 
    | comp_operators expression_2_pre expression_1_prime
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
        console.log($1, "jimob")
    }
    ;

expression_3_prime
    : /* empty */ 
    | mult_div_operand expression_4_pre expression_3_prime 
    ;

mult_div_operand
    : ASTERISK {
        console.log("repit")
        yy.data.semantics.storeOperator($1)
    }
    | SLASH {
        yy.data.semantics.storeOperator($1)
    }
    ;

expression_4
    : CTE_FLOAT {
        yy.data.semantics.storeConstOperand($1, "float");
    }
    | CTE_PI {
        yy.data.semantics.storeConstOperand(3.141592, "float");
    }
    | L_PAREN expression_0 R_PAREN 
    | CTE_INT {
        yy.data.semantics.storeConstOperand($1, "int");
    }
    | CTE_STRING{
        yy.data.semantics.storeConstOperand($1, "string");
    }
    | CTE_CHAR {
        yy.data.semantics.storeConstOperand($1, "char");
    }
    | TRUE {
        yy.data.semantics.storeConstOperand("1", "bool");
    }
    | FALSE {
        yy.data.semantics.storeConstOperand("0", "bool");
    }
    | id_call
    | object_attribute_call
    | sum
    | sin
    ;

id_call
    : pre_call_function call_params R_PAREN  {
        yy.data.semantics.callFunction($1);
    }
    | id_name {
        console.log("first")
    }
    | array_call {

    }
    ;

id_name 
    : ID_NAME {
        yy.data.semantics.storeVariableOperand($1);
    }
    ;

array_call
    : array_call_pre expression_0 array_call_r_bracket array_call_size {
        yy.data.semantics.processArrayCall();
    }
    ;

array_call_pre
    : id_name array_call_l_bracket_start {
    }
    ;

array_call_size
    : 
    | array_call_l_bracket expression_0 array_call_r_bracket array_call_size {
        // yy.data.semantics.processArraySize($1);
    }
    ;

array_call_l_bracket_start
    : L_BRACKET {
        yy.data.semantics.verifyArray();
    }
    ;

array_call_l_bracket
    : L_BRACKET {
        yy.data.semantics.nextDim();
    }
    ;

array_call_r_bracket
    : R_BRACKET {
        yy.data.semantics.createArrayQuad();
    }
    ;

pre_call_function
    : ID_NAME L_PAREN {
        yy.data.semantics.preCallFunction($1);
        $$ = $1;
    }
    ;

call_params
    :
    | pre_params call_params_prime
    ;

pre_params
    : expression_0 {
        yy.data.semantics.processCallParams($1);
    }
    ;
call_params_prime
    :
    | COMMA pre_params call_params_prime
    ;

comp_operators
    : EQ_COMP{
        yy.data.semantics.storeOperator($1)
    }
    | GE_COMP{
        yy.data.semantics.storeOperator($1)
    }
    | GT_COMP{
        yy.data.semantics.storeOperator($1)
    }
    | LE_COMP{
        yy.data.semantics.storeOperator($1)
    }
    | LT_COMP{
        yy.data.semantics.storeOperator($1)
    }
    | NE_COMP{
        yy.data.semantics.storeOperator($1)
    }
    ;