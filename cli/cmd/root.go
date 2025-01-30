package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

// rootCmd representa el comando base cuando no se pasan subcomandos
var rootCmd = &cobra.Command{
	Use:   "WebStack-Deployer-for-Docker",
	Short: "Descripción breve de tu aplicación",
	Long: `Una descripción más larga que abarca múltiples líneas y probablemente contiene
ejemplos y el uso de cómo usar la aplicación. Por ejemplo:

Cobra es una biblioteca CLI para Go que habilita aplicaciones.
Esta aplicación es una herramienta para generar los archivos necesarios
para crear rápidamente una aplicación Cobra.`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("¡Aplicación CLI funcionando!")
	},
}

// Execute agrega todos los subcomandos al comando raíz y configura los flags apropiados.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		fmt.Println("Error:", err)
		os.Exit(1)
	}
}

func init() {
	// Aquí defines tus flags y configuraciones.
	rootCmd.Flags().BoolP("toggle", "t", false, "Mensaje de ayuda para toggle")
}
