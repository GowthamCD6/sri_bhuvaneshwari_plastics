pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  parameters {
    string(name: 'DOCKERHUB_ORG', defaultValue: 'pcdpbit', description: 'Docker Hub namespace/user')
    string(name: 'REDEPLOY_TAG', defaultValue: '', description: 'Optional rollback/redeploy tag (example: v1.0.0). If set, build and push stages are skipped.')
  }

  environment {
    DEPLOY_BRANCH = 'deploy'
    TEST_BRANCH = 'test'
    MAIN_BRANCH = 'main'

    DEPLOY_HOST = '10.10.12.67'
    DEPLOY_PATH = '/opt/sbp'
    DEPLOY_SSH_KEY_FILE = '/var/jenkins_home/.ssh/sbp_deploy'

    DOCKERHUB_CREDENTIALS = 'pcdpbit-dockerhub'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Resolve Release Tag') {
      steps {
        script {
          if (!params.DOCKERHUB_ORG?.trim() || params.DOCKERHUB_ORG == 'your-dockerhub-org') {
            error('DOCKERHUB_ORG is invalid. Set it to your Docker Hub namespace, for example: pcdpbit')
          }

          def branchHints = [env.BRANCH_NAME, env.GIT_BRANCH, env.GIT_LOCAL_BRANCH, env.CHANGE_BRANCH, env.CHANGE_TARGET].findAll { it?.trim() }
          def headRefs = sh(
            script: "git for-each-ref --format='%(refname:short)' --points-at HEAD refs/remotes/origin refs/heads || true",
            returnStdout: true
          ).trim().readLines().findAll { it?.trim() }

          def isDeployContext = (branchHints + headRefs).any { ref ->
            ref == env.DEPLOY_BRANCH ||
            ref.endsWith("/${env.DEPLOY_BRANCH}") ||
            ref == "refs/heads/${env.DEPLOY_BRANCH}"
          }
          env.IS_DEPLOY_CONTEXT = isDeployContext ? 'true' : 'false'
          env.DEPLOY_EXECUTED = 'false'
          env.SKIP_BUILD_PUSH = 'false'

          echo "Branch hints: ${branchHints}"
          echo "HEAD refs: ${headRefs}"
          echo "Deploy context detected: ${env.IS_DEPLOY_CONTEXT}"

          def requestedTag = params.REDEPLOY_TAG?.trim()
          if (requestedTag) {
            env.IMAGE_TAG = requestedTag
            env.IS_REDEPLOY = 'true'
          } else {
            def latestTag = sh(script: "git describe --tags --abbrev=0 || echo ''", returnStdout: true).trim()
            if (!latestTag) {
              error('No Git tag found. Create and push a tag (for example v1.0.0) before deploying.')
            }
            env.IMAGE_TAG = latestTag
            env.IS_REDEPLOY = 'false'
          }

          env.FRONTEND_IMAGE = "${params.DOCKERHUB_ORG}/sbp-frontend:${env.IMAGE_TAG}"
          env.BACKEND_IMAGE = "${params.DOCKERHUB_ORG}/sbp-backend:${env.IMAGE_TAG}"
          echo "Using image tag: ${env.IMAGE_TAG}"
        }
      }
    }

    stage('Check Existing Images') {
      when {
        expression { env.IS_DEPLOY_CONTEXT == 'true' && env.IS_REDEPLOY == 'false' }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDENTIALS, usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
          script {
            def imageState = sh(
              script: '''
                set +e
                echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin >/dev/null 2>&1

                docker manifest inspect "$FRONTEND_IMAGE" >/dev/null 2>&1
                FRONTEND_EXISTS=$?

                docker manifest inspect "$BACKEND_IMAGE" >/dev/null 2>&1
                BACKEND_EXISTS=$?

                docker logout >/dev/null 2>&1 || true

                if [ "$FRONTEND_EXISTS" -eq 0 ] && [ "$BACKEND_EXISTS" -eq 0 ]; then
                  echo "EXISTS"
                else
                  echo "MISSING"
                fi
              ''',
              returnStdout: true
            ).trim()

            if (imageState == 'EXISTS') {
              env.SKIP_BUILD_PUSH = 'true'
              echo "Tag ${env.IMAGE_TAG} already exists in Docker Hub; skipping build/push and deploying directly."
            } else {
              env.SKIP_BUILD_PUSH = 'false'
              echo "Tag ${env.IMAGE_TAG} not found in Docker Hub; build and push will run."
            }
          }
        }
      }
    }

    stage('Build Images') {
      when {
        expression { env.IS_DEPLOY_CONTEXT == 'true' && env.IS_REDEPLOY == 'false' && env.SKIP_BUILD_PUSH != 'true' }
      }
      steps {
        sh '''
          DOCKER_BUILDKIT=1 docker build --pull --no-cache \\
            --build-arg VITE_API_URL="https://sbp.tylo.co.in/api" \\
            --build-arg VITE_GOOGLE_CLIENT_ID="880469513355-k3o8hhnvtsb6bbuf0r59270av24712o6.apps.googleusercontent.com" \\
            -t "$FRONTEND_IMAGE" ./client

          DOCKER_BUILDKIT=1 docker build --pull --no-cache -t "$BACKEND_IMAGE" ./server
        '''
      }
    }
 
    stage('Push Images') {
      when {
        expression { env.IS_DEPLOY_CONTEXT == 'true' && env.IS_REDEPLOY == 'false' && env.SKIP_BUILD_PUSH != 'true' }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDENTIALS, usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
          sh '''
            echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin
            docker push "$FRONTEND_IMAGE"
            docker push "$BACKEND_IMAGE"
            docker logout
          '''
        }
      }
    }

    stage('Deploy to 10.10.12.67') {
      when {
        expression { env.IS_DEPLOY_CONTEXT == 'true' }
      }
      steps {
        script {
          env.DEPLOY_EXECUTED = 'true'
        }
        sh '''
          SSH_KEY_FILE="$DEPLOY_SSH_KEY_FILE"
          SSH_TARGET="tylo@$DEPLOY_HOST"

          if [ ! -f "$SSH_KEY_FILE" ]; then
            echo "Missing SSH key file: $SSH_KEY_FILE"
            exit 1
          fi

          chmod 600 "$SSH_KEY_FILE"

          SSH_OPTS="-i $SSH_KEY_FILE -o IdentitiesOnly=yes -o StrictHostKeyChecking=no"

          ssh $SSH_OPTS "$SSH_TARGET" "DEPLOY_PATH='$DEPLOY_PATH' bash -s" <<'BOOTSTRAP'
            set -e
            mkdir -p "$DEPLOY_PATH"
BOOTSTRAP

          scp $SSH_OPTS docker-compose.yml "$SSH_TARGET:$DEPLOY_PATH/docker-compose.yml"

          ssh $SSH_OPTS "$SSH_TARGET" \
            "DEPLOY_PATH='$DEPLOY_PATH' DOCKERHUB_ORG='$DOCKERHUB_ORG' IMAGE_TAG='$IMAGE_TAG' bash -s" <<'REMOTE'
            set -e
            cd "$DEPLOY_PATH"

            if [ ! -f .env ]; then
              echo "Missing .env file at $DEPLOY_PATH/.env on deploy host"
              exit 1
            fi

            if [ -f .current_release ]; then
              cp .current_release .previous_release
            fi
            echo "$IMAGE_TAG" > .current_release

            export DOCKER_IMG_VERSION="$IMAGE_TAG"
            export DOCKERHUB_ORG

            docker compose pull sbp-frontend sbp-backend
            docker compose up -d sbp-frontend sbp-backend

            docker image prune -f
REMOTE
        '''
      }
    }

  }

  post {
    success {
      script {
        if (env.DEPLOY_EXECUTED == 'true') {
          echo "Success: deployed image tag ${env.IMAGE_TAG}"
          echo "Rollback hint: rerun this pipeline with REDEPLOY_TAG set to a previous successful tag."
        } else {
          echo "Success: no deploy performed because this run was not in deploy branch context."
          echo "Detected context: IS_DEPLOY_CONTEXT=${env.IS_DEPLOY_CONTEXT}"
        }
      }
    }
    failure {
      echo 'Pipeline failed. Deployment has not been promoted.'
    }
  }
}

