# 🤝 CONTRIBUTING

**Join us in building the future of private AI computation**  
*Your contributions help advance cryptographic intelligence*

[![Guidelines](https://img.shields.io/badge/GUIDELINES-9013FE?style=for-the-badge&logo=book&logoColor=white)](#-contribution-guidelines)
[![Development](https://img.shields.io/badge/DEVELOPMENT-50E3C2?style=for-the-badge&logo=code&logoColor=black)](#-development-workflow)


## 🎯 Welcome Contributors!

Thank you for your interest in contributing to zkCipherAI SDK! We're building the future of private, verifiable AI computation and we welcome contributions from developers, researchers, and enthusiasts alike.

### 🏗 Project Focus Areas

We're particularly interested in contributions in these areas:

- 🔐 **Cryptographic Implementations** - Encryption schemes, ZK circuits
- 🧠 **AI Integration** - Model optimization, new frameworks
- ⛓ **Blockchain** - Solana improvements, cross-chain support
- 🛠 **Developer Experience** - Better APIs, documentation, tools
- 🧪 **Testing & Security** - Comprehensive tests, security audits

## 📋 Contribution Guidelines

### 🎯 Types of Contributions We Welcome

#### 1. Code Contributions
- 🐛 **Bug Fixes** - Identify and fix issues
- ✨ **New Features** - Add functionality
- 🔧 **Improvements** - Optimize existing code
- 📚 **Examples** - Create usage examples

#### 2. Documentation
- 📖 **API Documentation** - Improve reference docs
- 🎓 **Tutorials** - Create learning materials
- 🌐 **Translations** - Translate documentation

#### 3. Testing & Quality
- 🧪 **Test Cases** - Add unit/integration tests
- 🔍 **Security Audits** - Identify security issues
- 📊 **Performance** - Benchmark and optimize

### 📝 Code Standards

#### TypeScript Standards

```typescript
// ✅ Good - Clear, typed, documented
interface EncryptionResult {
  data: Uint8Array;
  hash: string;
  timestamp: number;
}

/**
 * Encrypts tensor data using AES-256-GCM
 * @param tensor - Input tensor data
 * @param key - Cryptographic key
 * @returns Encrypted data with metadata
 */
async function encryptTensor(
  tensor: TensorData, 
  key: CryptoKey
): Promise<EncryptionResult> {
  // Implementation
}

// ❌ Avoid - Unclear, untyped, undocumented
function encrypt(data, key) {
  // ... 
}
```

#### File Organization

```
src/
├── cipher/
│   ├── encryptor.ts          # Main functionality
│   ├── encryptor.test.ts     # Tests for encryptor
│   ├── encryptor.types.ts    # Type definitions
│   └── index.ts              # Barrel exports
```

#### Naming Conventions

- **Files**: `camelCase` for implementation, `PascalCase` for classes
- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types**: `PascalCase`
- **Tests**: `describe` blocks for features, `it` for specific cases

### 🧪 Testing Requirements

#### Test Structure

```typescript
describe('Encryptor', () => {
  let encryptor: Encryptor;
  let testKey: CryptoKey;

  beforeEach(async () => {
    encryptor = new Encryptor();
    testKey = await generateTestKey();
  });

  describe('encryptTensor', () => {
    it('should encrypt tensor data successfully', async () => {
      // Arrange
      const tensor: TensorData = {
        data: new Float32Array([1, 2, 3]),
        shape: [1, 3],
        dtype: 'float32'
      };

      // Act
      const result = await encryptor.encryptTensor(tensor, testKey);

      // Assert
      expect(result.encryptedData).toBeDefined();
      expect(result.hash).toHaveLength(64); // SHA-256 hash
    });

    it('should throw error for invalid input', async () => {
      // Arrange
      const invalidTensor = {} as TensorData;

      // Act & Assert
      await expect(encryptor.encryptTensor(invalidTensor, testKey))
        .rejects.toThrow('Invalid tensor data');
    });
  });
});
```

#### Test Coverage Requirements

- ✅ **Unit Tests**: 90%+ coverage for all modules
- ✅ **Integration Tests**: End-to-end workflows
- ✅ **Edge Cases**: Error conditions, boundary values
- ✅ **Performance Tests**: For critical paths

### 📏 Pull Request Process

#### 1. Pre-PR Checklist

Before submitting a PR, ensure:

- [ ] ✅ Tests pass: `npm test`
- [ ] ✅ Code builds: `npm run build`
- [ ] ✅ Linting passes: `npm run lint`
- [ ] ✅ TypeScript compiles: `npx tsc --noEmit`
- [ ] ✅ Commit messages follow convention
- [ ] ✅ Branch is up to date with `main`

#### 2. Creating a Pull Request

```bash
# 1. Create feature branch from main
git checkout main
git pull upstream main
git checkout -b feature/amazing-feature

# 2. Make your changes and commit
git add .
git commit -m "feat: add encrypted batch processing"

# 3. Push to your fork
git push origin feature/amazing-feature

# 4. Create PR on GitHub with template
```

#### 3. PR Template

```markdown
## Description
<!-- Describe your changes in detail -->

## Related Issue
<!-- Link to issue if applicable -->
Fixes #123

## Type of Change
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 🔧 Improvement
- [ ] 📚 Documentation
- [ ] 🧪 Test

## Testing
- [ ] ✅ Unit tests added/updated
- [ ] ✅ Integration tests pass
- [ ] ✅ Manual testing performed

## Security Impact
- [ ] 🔒 No security impact
- [ ] 🛡 Improves security
- [ ] ⚠️ Requires security review

## Checklist
- [ ] Code follows project standards
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All checks pass
```

### 🔐 Security-First Development

#### Cryptographic Security

```typescript
// ✅ Secure - Constant-time operations
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ❌ Insecure - Timing attack vulnerable
function insecureCompare(a: string, b: string): boolean {
  return a === b;
}
```

#### Secure Coding Practices

- 🔒 **Never log sensitive data** (keys, plaintext)
- 🗑️ **Zeroize memory** after use
- 🔑 **Use cryptographically secure random** for keys
- 🛡️ **Validate all inputs** thoroughly
- 📜 **Follow principle of least privilege**

## 🏗 Development Workflow

### Branch Naming Convention

```
feature/  - New features
bugfix/   - Bug fixes
hotfix/   - Critical production fixes
docs/     - Documentation improvements
test/     - Test-related changes
refactor/ - Code refactoring
```

### Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add encrypted model synchronization
^--^  ^-----------------------------^
|     |
|     +-> Summary in present tense
|
+-------> Type: feat, fix, docs, style, refactor, test, chore
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semi-colons
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Code Review Process

#### What We Look For

```typescript
// ✅ Good PR - Clear, tested, documented
/**
 * Implements homomorphic encryption for tensor operations
 * Supports element-wise addition and multiplication
 * 
 * @example
 * const result = await homomorphicAdd(encryptedA, encryptedB);
 */
class HomomorphicEncryptor {
  // Well-documented implementation
}

// ❌ Problematic PR - Unclear, untested
class HomomorphicEncryptor {
  // Complex logic without comments
  // No tests
  // No type safety
}
```

#### Review Checklist

- [ ] **Functionality**: Does it work as intended?
- [ ] **Tests**: Are there adequate tests?
- [ ] **Documentation**: Is the code well-documented?
- [ ] **Security**: Any security concerns?
- [ ] **Performance**: Any performance impacts?
- [ ] **Standards**: Follows project conventions?

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

```markdown
## Description
Clear description of the issue

## Steps to Reproduce
1. ... 
2. ...
3. ...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- SDK Version: 
- Node.js Version:
- OS:
- Solana Network:

## Additional Context
Logs, screenshots, etc.
```

### Security Vulnerabilities

**⚠️ Please report security issues privately!**

Email: [security@zkcipher.ai](mailto:security@zkcipherai.xyz)

Do NOT disclose security issues publicly until they are patched.

## 💡 Feature Requests

We welcome feature requests! Please use the template:

```markdown
## Problem Statement
What problem are you trying to solve?

## Proposed Solution
How should this work?

## Alternative Solutions
Any other approaches?

## Additional Context
Use cases, examples, etc.
```

## 🛣 Getting Help

### Communication Channels

- **💬 GitHub Discussions**: General questions and ideas
- **🐛 GitHub Issues**: Bug reports and feature requests
- **🔒 Security Email**: [security@zkcipher.ai](mailto:security@zkcipher.ai)
- **📚 Documentation**: [docs.zkcipher.ai](https://docs.zkcipher.ai)

### Mentorship

New to cryptography or blockchain? We offer:

- **🎓 Beginner-friendly issues** labeled `good-first-issue`
- **👥 Pair programming** with experienced contributors
- **📖 Learning resources** in our documentation

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a friendly, safe, and welcoming environment for all contributors.

### Our Standards

**✅ Positive Behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**❌ Unacceptable Behavior:**
- Harassment of any kind
- Discriminatory language or imagery
- Personal or political attacks
- Publishing others' private information

### Enforcement

Instances of abusive behavior may be reported to the project team at [conduct@zkcipherai.xyz](mailto:conduct@zkcipherai.xyz). All complaints will be reviewed and investigated promptly.


## 🎉 Your First Contribution

### Good First Issues

Look for issues labeled:
- `good-first-issue` - Perfect for newcomers
- `help-wanted` - Could use some help
- `documentation` - Documentation improvements

### Quick Wins

- 📚 Fix typos in documentation
- 🧪 Add test cases
- 🔧 Improve error messages
- 📝 Write examples

### Getting Started

1. Find an issue that interests you
2. Comment that you'd like to work on it
3. Follow the development setup above
4. Ask for help if you get stuck!
5. Submit your PR 🚀

---

## 🚀 Ready to Contribute?

**Join our community of cryptographic AI builders!**

[**Find Good First Issues**](https://github.com/zkcipherai/zkcipherai-sdk/issues?q=is:open+is:issue+label:"good-first-issue") • 
[**Join Discussions**](https://github.com/zkcipherai/zkcipherai-sdk/discussions) • 

*Together, we're building the future of private AI computation.* 🔐🧠⛓