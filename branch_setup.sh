#!/bin/bash
set -e

# ブランチ名を引数から取得
BRANCH_NAME=$1

if [ -z "$BRANCH_NAME" ]; then
  echo "Error: ブランチ名を指定してください。"
  echo "Usage: ./branch_setup.sh <branch_name>"
  exit 1
fi

echo "ブランチ '$BRANCH_NAME' のスライド環境をセットアップします..."

# 1. mainブランチから新しいブランチを作成してチェックアウト
git checkout -b "$BRANCH_NAME"

# 2. ブランチ専用のディレクトリを作成
mkdir -p "slides/$BRANCH_NAME"

# 3. エージェント用のプロンプトファイルをコピーしてパスを調整
cp prompts/system_prompt.md "slides/$BRANCH_NAME/system_prompt.md"

# package.jsonのスクリプトをブランチ専用ディレクトリのファイルを向くように書き換え
# package.jsonはGitで管理されるため、ブランチごとに異なる設定を持つことができる
sed -i "s|../slide_input.json|slides/$BRANCH_NAME/slide_input.json|g" package.json
sed -i "s|build/output.md|slides/$BRANCH_NAME/output.md|g" package.json

# 変更をコミット
git add package.json "slides/$BRANCH_NAME/system_prompt.md"
git commit -m "Setup slide directory and config for branch $BRANCH_NAME"

echo "セットアップが完了しました。"
echo "スライドデータ(slide_input.json)は 'slides/$BRANCH_NAME/slide_input.json' に保存してください。"
echo "生成されたスライドは 'slides/$BRANCH_NAME/' に出力されます。"
