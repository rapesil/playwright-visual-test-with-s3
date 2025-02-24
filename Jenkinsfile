pipeline {
    agent {
        docker {
            image 'meu-playwright-java'
            args '--network playwright-s3_integra'
        }
    }

    stages {
        stage('Install dependencies') {
            steps {
                sh 'npm install'
            }
        }
        stage('Run tests') {
            steps {
                sh 'echo "JAVA_HOME=$JAVA_HOME" && java -version'
                sh 'npx playwright test'
                allure includeProperties: false, jdk: '', results: [[path: 'allure-results']]
            }
        }
    }
}
