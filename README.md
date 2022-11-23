# Lenguaje QWERTYUIOP

## Requerimientos

Lo requerido para correr el lenguaje es Node.js y Node Package Manager. Si no tienes Node.js y NPM puedes [descargarlo directamente de la página](https://nodejs.org/en/download/).

## Instalación
Una vez descargado el repositorio debes instalar las dependencias del lenguaje dentro del mismo repositorio en la terminal de esta manera:
```
% npm install
```
Después crearemos un comando en la terminal para correr un archivo:
```
% npm link
```

## Correr un Archivo
Una vez ya habiendo instalado todo y habiendo corrido los paquetes podemos correr en la terminal el siguiente comando para correr un archivo:
```
% qwertyuiop DIRECCION_DEL_ARCHIVO
```


## Codigo de Ejemplo
```
var array : int [20];
var variable : int;
 
func exampleFunciton(param1: int) : void {
    var i : int = 0;
    while (i <= param1) {
        array[i] = i;
        print(i);
        i = i + 1;
    }
}
 
func main () {
    exampleFunction(20);
    print(array);

    return 0;
}
```