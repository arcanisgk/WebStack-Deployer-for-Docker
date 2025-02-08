package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

// rootCmd representa el comando base cuando no se pasan subcomandos
var rootCmd = &cobra.Command{
	Use:   "WebStack-Deployer-for-Docker",
	Short: "Docker WebStack Deployment Tool",
	Long: `WebStack Deployer for Docker is a comprehensive tool for managing 
    and deploying web application stacks using Docker containers.
    It provides an easy-to-use interface for container orchestration 
    and deployment management.`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("WebStack Deployer for Docker is running!")
	},
}

// Execute agrega todos los subcomandos al comando raíz y configura los flags apropiados.
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.Flags().BoolP("version", "v", false, "Display version information")
	rootCmd.Flags().BoolP("debug", "d", false, "Enable debug mode")
}
