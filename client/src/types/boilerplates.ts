export const LANGUAGE_BOILERPLATES: Record<string, string> = {
  python: `# Welcome to DevCollab Workspace
def calculate_velocity(distance: float, time: float) -> float:
    if time <= 0:
        raise ValueError("Time must be positive")
    return distance / time

print('Velocity:', calculate_velocity(100, 5))
`,

  javascript: `// Welcome to DevCollab Workspace
function calculateVelocity(distance, time) {
  if (time <= 0) throw new Error("Time must be positive");
  return distance / time;
}

console.log(calculateVelocity(100, 5));
`,

  typescript: `// Welcome to DevCollab Workspace
function calculateVelocity(distance: number, time: number): number {
  if (time <= 0) throw new Error("Time must be positive");
  return distance / time;
}

console.log(calculateVelocity(100, 5));
`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "DevCollab C++ Ready" << endl;
    return 0;
}
`,

  c: `#include <stdio.h>

int main() {
    printf("DevCollab C Ready\\n");
    return 0;
}
`,

  java: `// Welcome to DevCollab Workspace
public class Main {
    public static double calculateVelocity(double distance, double time) {
        if (time <= 0) {
            throw new IllegalArgumentException("Time must be positive");
        }
        return distance / time;
    }

    public static void main(String[] args) {
        System.out.println("Velocity: " + calculateVelocity(100, 5));
    }
}
`,

  rust: `// Welcome to DevCollab Workspace
fn calculate_velocity(distance: f64, time: f64) -> Result<f64, &'static str> {
    if time <= 0.0 {
        return Err("Time must be positive");
    }
    Ok(distance / time)
}

fn main() {
    match calculate_velocity(100.0, 5.0) {
        Ok(v) => println!("Velocity: {}", v),
        Err(e) => eprintln!("Error: {}", e),
    }
}
`,

  go: `// Welcome to DevCollab Workspace
package main

import (
	"errors"
	"fmt"
)

func calculateVelocity(distance, time float64) (float64, error) {
	if time <= 0 {
		return 0, errors.New("time must be positive")
	}
	return distance / time, nil
}

func main() {
	v, err := calculateVelocity(100, 5)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	fmt.Printf("Velocity: %.2f\\n", v)
}
`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DevCollab App</title>
  <style>
    body { font-family: system-ui; background: #0a0a0c; color: #fff; display: grid; place-content: center; height: 100vh; margin: 0; }
    h1 { color: #06b6d4; }
  </style>
</head>
<body>
  <h1>Hello from DevCollab!</h1>
  <p>Real-time collaborative workspace</p>
</body>
</html>
`,

  css: `/* DevCollab Styling */
:root {
  --bg-obsidian: #0a0a0c;
  --accent-cyan: #06b6d4;
  --accent-violet: #8b5cf6;
}

body {
  margin: 0;
  padding: 2rem;
  background-color: var(--bg-obsidian);
  color: #f4f4f5;
  font-family: 'JetBrains Mono', monospace;
}

.card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
}
`,

  json: `{
  "project": "DevCollab",
  "version": "1.0.0",
  "description": "Real-time developer collaboration workspace",
  "features": [
    "Monaco Code Editor",
    "Fabric.js Interactive Canvas",
    "WebRTC Audio/Video Calls",
    "Real-time Chat & Presence"
  ],
  "status": "online"
}
`,

  markdown: `# DevCollab Workspace

A futuristic, ultra-modern dark collaboration environment.

## Features
- **Monaco Code Editor**: Real-time collaborative typing with multi-cursor presence
- **Interactive Whiteboard**: Fabric.js canvas with shape tools and synchronization
- **WebRTC Calling**: Mesh P2P audio and video communication
- **Team Chat**: Instant group messaging with unread counter
`,

  sql: `-- Welcome to DevCollab Workspace
CREATE TABLE IF NOT EXISTS developers (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'online',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO developers (username, status) 
VALUES ('dev_alice', 'online'), ('dev_bob', 'coding');

SELECT * FROM developers WHERE status = 'online';
`,
};
