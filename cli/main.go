package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

type AppConfig struct {
	StructureDir string
	ScriptDir    string
	DataDir      string
	ConfigDir    string
	BackupDir    string
	UpdatesDir   string
	LogsDir      string
}

var appConfig AppConfig

const appName string = "WebStack-Deployer-for-Docker"

type CommandRequest struct {
	Command string   `json:"command"`
	Args    []string `json:"args"`
}

type CommandResponse struct {
	Output string `json:"output"`
	Error  string `json:"error,omitempty"`
}

// initializeAppDirectories sets up the application directory structure
func initializeAppDirectories() error {
	// Get user home directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get user home directory: %v", err)
	}

	// Set up base directory based on OS
	var baseDir string
	switch runtime.GOOS {
	case "windows":
		baseDir = filepath.Join(os.Getenv("APPDATA"), appName)
	case "darwin":
		baseDir = filepath.Join(homeDir, "Library", "Application Support", appName)
	default: // linux and others
		baseDir = filepath.Join(homeDir, fmt.Sprintf(".%s", appName))
	}

	// Create directory structure
	dirs := []string{
		baseDir,
		filepath.Join(baseDir, "structure"),
		filepath.Join(baseDir, "script"),
		filepath.Join(baseDir, "config"),
		filepath.Join(baseDir, "backup"),
		filepath.Join(baseDir, "updates"),
		filepath.Join(baseDir, "logs"),
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("failed to create directory %s: %v", dir, err)
		}
	}

	// Store paths in app config
	appConfig = AppConfig{
		DataDir:      baseDir,
		StructureDir: filepath.Join(baseDir, "structure"),
		ScriptDir:    filepath.Join(baseDir, "script"),
		ConfigDir:    filepath.Join(baseDir, "config"),
		BackupDir:    filepath.Join(baseDir, "backup"),
		UpdatesDir:   filepath.Join(baseDir, "updates"),
		LogsDir:      filepath.Join(baseDir, "logs"),
	}

	return nil
}

func enableCORS(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		handler(w, r)
	}
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{
		"status":  "running",
		"message": "WebStack Deployer for Docker API",
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func executeCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CommandRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var c *exec.Cmd
	if runtime.GOOS == "windows" {
		c = exec.Command("c", "/C", req.Command)
	} else {
		c = exec.Command("bash", "-c", req.Command)
	}

	output, err := c.CombinedOutput()
	response := CommandResponse{
		Output: string(output),
	}
	if err != nil {
		response.Error = err.Error()
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func main() {
	// Initialize application directories
	if err := initializeAppDirectories(); err != nil {
		log.Fatalf("Failed to initialize application directories: %v", err)
	}

	// Set up logging to file
	logFile, err := os.OpenFile(
		filepath.Join(appConfig.LogsDir, "app.log"),
		os.O_CREATE|os.O_WRONLY|os.O_APPEND,
		0644,
	)
	if err != nil {
		log.Fatalf("Failed to open log file: %v", err)
	}
	defer func(logFile *os.File) {
		err := logFile.Close()
		if err != nil {

		}
	}(logFile)
	log.SetOutput(logFile)

	// Create a new mux router
	mux := http.NewServeMux()

	// Register handlers with CORS
	mux.HandleFunc("/", enableCORS(rootHandler))
	mux.HandleFunc("/execute", enableCORS(executeCommand))

	// Configure the server
	server := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	// Start the server
	fmt.Println("WebStack Deployer for Docker API Server starting on http://localhost:8080")
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
